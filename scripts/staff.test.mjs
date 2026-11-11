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
const staff = load("../src/services/staff.ts");
const { default: Card } = load("../src/components/Orders/OrderCard.tsx");
const { parseOrders } = load("../src/services/orders.ts");
Object.assign(require.extensions, saved);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");

const abebe = { id: "m-abebe", name: "Abebe Kebede", role: "Photographer", skills: ["Photography"], photoUrl: null };
const sara = { id: "m-sara", name: "Sara", role: "Waiter", skills: [], photoUrl: null };
const schedule = {
  from: "2026-12-01", to: "2026-12-07", staff: [abebe, sara],
  bookings: [
    { id: "b-1", startDate: "2026-12-02", endDate: "2026-12-03", status: "CONFIRMED", staff: ["m-abebe"], itemIds: [] },
    { id: "b-old", startDate: "2026-12-02", endDate: "2026-12-02", status: "COMPLETED", staff: ["m-sara"], itemIds: [] },
  ],
  timeOff: [{ id: "t-1", memberId: "m-sara", startDate: "2026-12-05", endDate: "2026-12-06", note: "" }],
};

test("week and day helpers use plain UTC dates", () => {
  assert.equal(staff.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(staff.addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(staff.weekStart("2026-12-06"), "2026-11-30"); // Sunday -> Monday before
  assert.equal(staff.weekStart("2026-11-30"), "2026-11-30");
  assert.deepEqual(staff.daysFrom("2026-12-30", 3), ["2026-12-30", "2026-12-31", "2027-01-01"]);
  assert.deepEqual(staff.orderRange("2026-12-01 - 2026-12-03"), { start: "2026-12-01", end: "2026-12-03" });
  assert.equal(staff.orderRange("soon"), null);
});

test("availability shows time off first, then other open bookings, ignoring closed ones", () => {
  assert.equal(staff.availability(abebe, schedule, "b-new", "2026-12-03", "2026-12-03").state, "busy");
  assert.equal(staff.availability(abebe, schedule, "b-1", "2026-12-03", "2026-12-03").state, "free"); // its own booking
  assert.equal(staff.availability(sara, schedule, "b-new", "2026-12-02", "2026-12-02").state, "free"); // completed booking
  assert.equal(staff.availability(sara, schedule, "b-new", "2026-12-04", "2026-12-05").state, "off");
});

test("conflicts are described in plain words", () => {
  assert.match(staff.describeConflict({ memberId: "m-sara", type: "TIME_OFF", bookingId: null, timeOffId: "t-1", startDate: "2026-12-05", endDate: "2026-12-06" }, [sara]), /^Sara is off /);
  assert.match(staff.describeConflict({ memberId: "m-abebe", type: "DOUBLE_BOOKED", bookingId: "b-1234567890", timeOffId: null, startDate: "2026-12-02", endDate: "2026-12-02" }, [abebe]), /already on booking b-123456/);
});

test("skills are trimmed, de-duplicated and capped at ten", () => {
  assert.deepEqual(staff.parseSkills(" Photo , Video,Photo,, "), ["Photo", "Video"]);
  assert.equal(staff.parseSkills(Array.from({ length: 15 }, (_, i) => `s${i}`).join(",")).length, 10);
  assert.equal(staff.initials("Abebe Kebede Tola"), "AK");
});

test("order cards offer staff assignment only on open bookings", () => {
  const order = status => parseOrders([{ bookingId: `booking-${status}`, customerId: "customer-123", status,
    startDate: "2026-12-01", endDate: "2026-12-03", totalMinor: 12345, currency: "ETB" }])[0];
  const card = (status, staffList) => renderToStaticMarkup(React.createElement(Card, { order: order(status), busy: false,
    onAction: () => {}, onReview: () => {}, staff: staffList, onAssign: () => {} }));
  assert.match(card("CONFIRMED", []), /Assign staff/);
  assert.match(card("CONFIRMED", [abebe]), /Change staff/);
  assert.match(card("CONFIRMED", [abebe]), /Staff: Abebe Kebede/);
  assert.doesNotMatch(card("COMPLETED", [abebe]), /Assign staff|Change staff/);
  const withoutHandler = renderToStaticMarkup(React.createElement(Card, { order: order("CONFIRMED"), busy: false, onAction: () => {}, onReview: () => {} }));
  assert.doesNotMatch(withoutHandler, /Assign staff/);
});
