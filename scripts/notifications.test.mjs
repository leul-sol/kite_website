import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { installSrcAlias } from "./ts-alias.mjs";
installSrcAlias();

const require = createRequire(import.meta.url);
const ts = require("typescript");
const saved = Object.fromEntries([".ts", ".tsx", ".css"].map(ext => [ext, require.extensions[ext]]));
const compile = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
require.extensions[".ts"] = compile; require.extensions[".tsx"] = compile;
require.extensions[".css"] = module => { module.exports = { __esModule: true, default: {} }; };
const load = path => require(fileURLToPath(new URL(path, import.meta.url)));
const { portalLink, parseNotifications, timeAgo } = load("../src/services/notifications.ts");
const { default: Card } = load("../src/components/Orders/OrderCard.tsx");
const { parseOrders } = load("../src/services/orders.ts");
Object.assign(require.extensions, saved);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");

test("notification links open the matching portal page", () => {
  assert.equal(portalLink("/provider/bookings/2f1c-9a"), "/orders?booking=2f1c-9a");
  assert.equal(portalLink("/messages/abc-123"), "/messages?c=abc-123");
  assert.equal(portalLink("/wallet"), "/wallet");
  assert.equal(portalLink("/provider/verification"), "/verification");
  assert.equal(portalLink("/team-work"), "/my-work");
  // Customer screens and anything odd stay unlinked.
  assert.equal(portalLink("/bookings/abc"), null);
  assert.equal(portalLink("https://evil.example/x"), null);
  assert.equal(portalLink("/provider/bookings/../admin"), null);
  assert.equal(portalLink("/provider/bookings/a b"), "/orders");
  assert.equal(portalLink(undefined), null);
});

test("notifications are read defensively", () => {
  const rows = parseNotifications([
    { id: "n1", type: "booking.paid", title: "New paid booking", body: "Booking ab12 was paid.", read: false,
      createdAt: "2026-11-14T10:00:00Z", link: "/provider/bookings/ab12" },
    { id: "n2", title: 5, read: "yes" },
    "junk", null, { title: "no id" },
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { id: "n1", type: "booking.paid", title: "New paid booking", body: "Booking ab12 was paid.",
    read: false, createdAt: "2026-11-14T10:00:00Z", href: "/orders?booking=ab12" });
  assert.equal(rows[1].title, "Notification");
  assert.equal(rows[1].read, false);
  assert.equal(rows[1].href, null);
  assert.deepEqual(parseNotifications({ not: "a list" }), []);
});

test("times read as short relative labels", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  assert.equal(timeAgo("2026-11-14T11:59:40Z", now), "Just now");
  assert.equal(timeAgo("2026-11-14T11:55:00Z", now), "5m ago");
  assert.equal(timeAgo("2026-11-14T09:00:00Z", now), "3h ago");
  assert.equal(timeAgo("2026-11-12T12:00:00Z", now), "2d ago");
  assert.equal(timeAgo("2026-10-01T12:00:00Z", now), "1 Oct 2026");
  assert.equal(timeAgo("not a date", now), "");
});

test("the booking a notification points to is highlighted on the board", () => {
  const [order] = parseOrders([{ bookingId: "booking-1", customerId: "c", status: "PAID",
    startDate: "2026-12-01", endDate: "2026-12-03", totalMinor: 100, currency: "ETB" }]);
  const props = { order, busy: false, onAction: () => {}, onReview: () => {} };
  const plain = renderToStaticMarkup(React.createElement(Card, props));
  const marked = renderToStaticMarkup(React.createElement(Card, { ...props, highlighted: true }));
  assert.match(plain, /id="order-booking-1"/);
  assert.doesNotMatch(plain, /aria-current/);
  assert.match(marked, /aria-current="true"/);
  assert.match(marked, /ring-primary/);
});
