import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { installSrcAlias } from "./ts-alias.mjs";
installSrcAlias();

// Render the actual TSX view with React SSR. No browser state or CSS assertions;
// these checks cover financial labels, partial failures and honest loading states.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const previousTs = require.extensions[".ts"], previousTsx = require.extensions[".tsx"], previousCss = require.extensions[".css"];
const compile = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
require.extensions[".ts"] = compile; require.extensions[".tsx"] = compile;
require.extensions[".css"] = module => { module.exports = { __esModule: true, default: {} }; };
const { default: DashboardView } = require(fileURLToPath(new URL("../src/components/Dashboard/DashboardView.tsx", import.meta.url)));
const { parseWalletDashboard, parseBookingDashboard, formatDashboardMoney } = require(fileURLToPath(new URL("../src/services/provider-dashboard.ts", import.meta.url)));
require.extensions[".ts"] = previousTs; require.extensions[".tsx"] = previousTsx; require.extensions[".css"] = previousCss;
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const funds = { availableMinor: "3500", heldEarningsMinor: "1200", releasedEarningsMinor: "3000", currency: "ETB", asOf: "2026-01-01T12:00:00Z" };
const bookings = { counts: { totalBookings: 14, awaitingPayment: 1, awaitingConfirmation: 1, currentRentals: 3, completed: 1, changeRequests: 2, closed: 5, other: 1, asOf: funds.asOf }, recentActivity: [
  { id: "event-1", bookingId: "12345678-1111-4111-8111-111111111111", status: "CANCELLED", createdAt: funds.asOf },
  { id: "event-2", bookingId: "87654321-1111-4111-8111-111111111111", status: "PAID", createdAt: funds.asOf },
] };
const ready = data => ({ status: "ready", data });
const render = (wallet, data) => renderToStaticMarkup(React.createElement(DashboardView, { wallet, bookings: data, refresh() {} }));

test("dashboard distinguishes available balance, held earnings and lifetime released credits", () => {
  const html = render(ready(parseWalletDashboard(funds)), ready(parseBookingDashboard(bookings)));
  for (const text of ["Available wallet balance", "Held rental earnings", "Released booking earnings", "ETB 35.00", "ETB 12.00", "ETB 30.00", "Closed / expired", "Change requests"]) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /Total Earnings|Profile Visits|Revenue Chart Placeholder|Royal Velvet|\+12\.5%/);
  assert.ok(html.includes("Booking 12345678: cancelled"));
  assert.ok(html.includes("Booking 87654321: paid"));
});
test("loading never presents zero-valued account data", () => {
  const html = render({ status: "loading" }, { status: "loading" });
  assert.ok(html.includes("Loading account data")); assert.ok(html.includes("Loading…"));
  assert.ok(!html.includes("ETB 0.00")); assert.ok(!html.includes("No booking activity yet"));
});
test("wallet outage preserves real booking metrics and reports financials unavailable", () => {
  const html = render({ status: "error" }, ready(bookings));
  assert.ok(html.includes("Wallet data could not be loaded")); assert.ok(html.includes("Unavailable"));
  assert.ok(html.includes("Booking 12345678: cancelled")); assert.ok(!html.includes("ETB 0.00"));
});
test("booking outage preserves real wallet amounts without fabricated activity", () => {
  const html = render(ready(funds), { status: "error" });
  assert.ok(html.includes("Booking data could not be loaded")); assert.ok(html.includes("ETB 35.00"));
  assert.ok(!html.includes("No booking activity yet")); assert.ok(!html.includes("Booking 12345678"));
});
test("successful empty responses show genuine zero balances and empty activity", () => {
  const counts = Object.fromEntries(Object.keys(bookings.counts).map(key => [key, key === "asOf" ? funds.asOf : 0]));
  const html = render(ready({ ...funds, availableMinor: "0", heldEarningsMinor: "0", releasedEarningsMinor: "0" }), ready({ counts, recentActivity: [] }));
  assert.ok(html.includes("ETB 0.00")); assert.ok(html.includes("No booking activity yet."));
});
test("large money values retain exact minor units and malformed values are rejected", () => {
  const value = "18446744073709551614";
  assert.equal(formatDashboardMoney(value, "ETB"), "ETB 184,467,440,737,095,516.14");
  for (const bad of [Number.MAX_SAFE_INTEGER + 1, "1.5", "-1", null]) assert.throws(() => parseWalletDashboard({ ...funds, heldEarningsMinor: bad }));
});
test("invalid booking counts cannot silently become zero or lose closed statuses", () => {
  assert.throws(() => parseBookingDashboard({ ...bookings, counts: { ...bookings.counts, closed: -1 } }));
  assert.throws(() => parseBookingDashboard({ ...bookings, counts: { ...bookings.counts, totalBookings: 99 } }));
  assert.throws(() => parseBookingDashboard({ ...bookings, recentActivity: [{ status: "PAID" }] }));
});
