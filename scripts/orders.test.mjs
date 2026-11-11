import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const saved = Object.fromEntries([".ts", ".tsx", ".css"].map(ext => [ext, require.extensions[ext]]));
const compile = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
require.extensions[".ts"] = compile; require.extensions[".tsx"] = compile;
require.extensions[".css"] = module => { module.exports = { __esModule: true, default: {} }; };
const load = path => require(fileURLToPath(new URL(path, import.meta.url)));
const { default: View } = load("../src/components/Orders/OrderBoardView.tsx");
const { default: Card } = load("../src/components/Orders/OrderCard.tsx");
const { parseOrders, parseOrderChanges, orderActions, orderColumn } = load("../src/services/orders.ts");
const { api } = load("../src/services/api.ts");
Object.assign(require.extensions, saved);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const booking = status => ({ bookingId: `booking-${status}`, customerId: "customer-123", status,
  startDate: "2026-12-01", endDate: "2026-12-03", totalMinor: 12345, currency: "ETB" });
const order = status => parseOrders([booking(status)])[0];
const noop = () => {};
const render = overrides => renderToStaticMarkup(React.createElement(View, {
  orders: [], loading: false, error: "", busy: false, refresh: noop, onAction: noop, onReview: noop,
  pending: null, review: null, note: "", onNote: noop, onClose: noop, onConfirm: noop, onResolve: noop, ...overrides,
}));

test("each raw status remains visible in its correct group, including closed and unknown bookings", () => {
  const states = { REQUESTED: "payment", PAID: "confirmation", CONFIRMED: "confirmed", ACTIVE: "progress", PICKED_UP: "progress",
    COMPLETED: "completed", CANCELLATION_REQUESTED: "changes", RESCHEDULE_REQUESTED: "changes", CANCELLED: "closed", REJECTED: "closed",
    REFUNDED: "closed", EXPIRED: "closed", FUTURE_STATE: "other" };
  const orders = parseOrders(Object.keys(states).map(booking));
  for (const item of orders) { assert.equal(orderColumn(item.status), states[item.status]); assert.ok(render({ orders: [item] }).includes(item.id)); }
  assert.ok(render({ orders }).includes("Other statuses"));
  assert.equal(orders[0].total, "ETB 123.45");
});
test("only transitions accepted by the provider status endpoint are offered", () => {
  assert.deepEqual(orderActions("REQUESTED").map(a => a.target), ["REJECTED"]);
  assert.deepEqual(orderActions("PAID").map(a => a.target), ["CONFIRMED"]);
  assert.deepEqual(orderActions("CONFIRMED").map(a => a.target), ["ACTIVE", "CANCELLED"]);
  assert.deepEqual(orderActions("ACTIVE").map(a => a.target), ["COMPLETED"]);
  for (const status of ["COMPLETED", "CANCELLED", "EXPIRED", "REJECTED", "REFUNDED", "PICKED_UP", "FUTURE_STATE", "CANCELLATION_REQUESTED", "RESCHEDULE_REQUESTED"]) {
    assert.deepEqual(orderActions(status), []);
    const html = renderToStaticMarkup(React.createElement(Card, { order: order(status), busy: false, onAction: noop, onReview: noop }));
    assert.doesNotMatch(html, /Confirm booking|Start rental|Complete rental|Advance/);
    assert.equal(html.includes("Review change request"), status.endsWith("_REQUESTED"));
  }
});
test("loading and failed requests do not masquerade as an empty account", () => {
  assert.ok(render({ loading: true }).includes("Loading bookings"));
  assert.ok(!render({ loading: true }).includes("No bookings yet"));
  const failed = render({ error: "Bookings could not be loaded" });
  assert.ok(failed.includes('role="alert"')); assert.ok(!failed.includes("No bookings yet"));
  assert.ok(render({}).includes("No bookings yet"));
});
test("dangerous status changes require confirmation and explain settlement", () => {
  const html = render({ pending: { order: order("CONFIRMED"), target: "CANCELLED" } });
  assert.ok(html.includes("Confirm action")); assert.ok(html.includes("customer wallet"));
  const busy = render({ busy: true, pending: { order: order("ACTIVE"), target: "COMPLETED" } });
  assert.match(busy, /disabled=""[^>]*>Confirm action/); assert.ok(busy.includes("held funds"));
});
test("change review displays actual requested dates and reason with explicit approval and decline", () => {
  const html = render({ review: { order: order("RESCHEDULE_REQUESTED"), changes: [{ id: "change-1", request_type: "RESCHEDULE", status: "OPEN",
    requested_role: "CUSTOMER", reason: "Venue changed", requested_start_date: "2026-12-05", requested_end_date: "2026-12-07" }] } });
  for (const text of ["Venue changed", "2026-12-05", "2026-12-07", "Approve request", "Decline request", "Decision note"]) assert.ok(html.includes(text));
});
test("provider-initiated changes await the customer's decision without self-approval controls", () => {
  const html = render({ review: { order: order("RESCHEDULE_REQUESTED"), changes: [{ id: "change-1", request_type: "RESCHEDULE", status: "OPEN",
    requested_role: "PROVIDER", reason: "Move date", requested_start_date: "2026-12-05", requested_end_date: "2026-12-07" }] } });
  assert.ok(html.includes("Awaiting the customer")); assert.doesNotMatch(html, /Approve request|Decline request/);
});
test("malformed or unsafe booking amounts fail instead of showing rounded or zero money", () => {
  for (const totalMinor of [Number.MAX_SAFE_INTEGER + 1, -1, null, "12345"]) assert.throws(() => parseOrders([{ ...booking("PAID"), totalMinor }]));
  assert.throws(() => parseOrders({}));
  assert.throws(() => parseOrders([{ ...booking("PAID"), status: null }]));
  assert.throws(() => parseOrderChanges([{ id: "change-1", status: "OPEN", request_type: "UNKNOWN", reason: null }]));
  assert.throws(() => parseOrderChanges([{ id: "change-1", status: "OPEN", request_type: "RESCHEDULE", reason: "Move date", requested_start_date: null, requested_end_date: null }]));
});
test("API preserves raw statuses and sends explicit transition and change-resolution payloads", async () => {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, options) => {
    seen.push({ url, options });
    return new Response(JSON.stringify(options.method ? {} : [booking("EXPIRED")]), { status: 200 });
  };
  try {
    assert.equal((await api.getOrders())[0].status, "EXPIRED");
    await api.updateOrderStatus("booking-1", "ACTIVE");
    assert.equal(seen[1].url, "/api/backend/bookings/booking-1/status");
    assert.equal(seen[1].options.method, "PATCH");
    assert.deepEqual(JSON.parse(seen[1].options.body), { status: "ACTIVE" });
    await api.resolveOrderChange("booking-1", "change-1", false, "Keep the agreed dates");
    assert.equal(seen[2].url, "/api/backend/bookings/booking-1/change-requests/change-1/resolve");
    assert.deepEqual(JSON.parse(seen[2].options.body), { approved: false, note: "Keep the agreed dates" });
    globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Resolve the open change request explicitly" }), { status: 409 });
    await assert.rejects(api.updateOrderStatus("booking-1", "CONFIRMED"), /Resolve the open change request explicitly/);
  } finally { globalThis.fetch = original; }
});
