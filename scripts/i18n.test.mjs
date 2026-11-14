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
const { en } = load("../src/i18n/en.ts");
const { am } = load("../src/i18n/am.ts");
const { translate, translateCount, formatMoney, formatDate, timeAgo, normalizeLocale } = load("../src/i18n/translate.ts");
const { StaticI18nProvider } = load("../src/i18n/I18nProvider.tsx");
const { default: DashboardView } = load("../src/components/Dashboard/DashboardView.tsx");
const { parseWalletDashboard, parseBookingDashboard } = load("../src/services/provider-dashboard.ts");
const { default: OrderBoardView } = load("../src/components/Orders/OrderBoardView.tsx");
const { default: ListingPhotoView } = load("../src/components/Listings/ListingPhotoView.tsx");
const { parseOrders } = load("../src/services/orders.ts");
const staff = load("../src/services/staff.ts");
const { validatePhoto } = load("../src/services/listing-photos.ts");
const { TextError } = load("../src/i18n/errors.ts");
Object.assign(require.extensions, saved);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(",");

test("every English text has an Amharic translation with the same values", () => {
  assert.deepEqual(Object.keys(am).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en)) {
    assert.equal(placeholders(am[key]), placeholders(en[key]), `placeholders differ for ${key}`);
    assert.ok(am[key].trim().length > 0, `empty Amharic for ${key}`);
  }
});

test("Amharic is actually Amharic where it should be", () => {
  // Brand names and symbols aside, nearly every Amharic string uses Ethiopic letters.
  const latinOnly = Object.entries(am).filter(([key, text]) => !/[ሀ-፿]/.test(text) && key !== "lang.switch");
  assert.deepEqual(latinOnly.map(([key]) => key), []);
});

test("values are filled in, and unknown ones are left visible", () => {
  assert.equal(translate("en", "invite.join", { business: "Demo Rentals" }), "Join Demo Rentals");
  assert.equal(translate("am", "invite.join", { business: "Demo Rentals" }), "Demo Rentalsን ይቀላቀሉ");
  assert.equal(translate("en", "shell.account"), "Account: {name}");
  assert.equal(normalizeLocale("am"), "am");
  assert.equal(normalizeLocale("fr"), "en");
  assert.equal(normalizeLocale(undefined), "en");
});

test("money, dates and times read naturally in each language", () => {
  assert.equal(formatMoney("en", 150000), "ETB 1,500.00");
  assert.equal(formatMoney("am", 150000), "1,500.00 ብር");
  assert.equal(formatDate("en", "2026-11-14T12:00:00Z"), "14 Nov 2026");
  assert.doesNotMatch(formatDate("am", "2026-11-14T12:00:00Z"), /Nov/);
  const now = Date.parse("2026-11-14T12:00:00Z");
  assert.equal(timeAgo("en", "2026-11-14T11:55:00Z", now), "5m ago");
  assert.equal(timeAgo("am", "2026-11-14T11:55:00Z", now), "ከ5 ደቂቃ በፊት");
  assert.equal(translateCount("en", "missing.key", 2), "missing.key_other");
});

test("the dashboard renders in Amharic", () => {
  const funds = { availableMinor: "3500", heldEarningsMinor: "1200", releasedEarningsMinor: "3000", currency: "ETB", asOf: "2026-01-01T12:00:00Z" };
  const bookings = { counts: { totalBookings: 4, awaitingPayment: 1, awaitingConfirmation: 1, currentRentals: 1, completed: 1, changeRequests: 0, closed: 0, other: 0, asOf: funds.asOf },
    recentActivity: [{ id: "e1", bookingId: "12345678-1111-4111-8111-111111111111", status: "PAID", createdAt: funds.asOf }] };
  const view = React.createElement(DashboardView, {
    wallet: { status: "ready", data: parseWalletDashboard(funds) },
    bookings: { status: "ready", data: parseBookingDashboard(bookings) }, refresh() {},
  });
  const html = renderToStaticMarkup(React.createElement(StaticI18nProvider, { locale: "am" }, view));
  assert.ok(html.includes("አጠቃላይ እይታ"), "title");
  assert.ok(html.includes("35.00 ብር"), "money in Amharic");
  assert.ok(html.includes("ትዕዛዝ 12345678፦ ተከፍሏል"), "booking event");
  assert.ok(!html.includes("Available wallet balance"), "no English left");
});

const inAmharic = element => renderToStaticMarkup(React.createElement(StaticI18nProvider, { locale: "am" }, element));

test("the orders board and its cards render in Amharic, with money in ብር", () => {
  const orders = parseOrders([
    { bookingId: "paid-0001-0000", customerId: "customer-1", status: "PAID", startDate: "2026-12-01", endDate: "2026-12-02", totalMinor: 41500, currency: "ETB" },
    { bookingId: "conf-0002-0000", customerId: "customer-2", status: "CONFIRMED", startDate: "2026-12-03", endDate: "2026-12-03", totalMinor: 73000, currency: "ETB" },
  ]);
  const noop = () => {};
  const html = inAmharic(React.createElement(OrderBoardView, { orders, loading: false, error: "", busy: false, refresh: noop, onAction: noop,
    onReview: noop, pending: null, review: null, note: "", onNote: noop, onClose: noop, onConfirm: noop, onResolve: noop }));
  for (const text of ["ማረጋገጫ በመጠበቅ ላይ", "ትዕዛዙን አረጋግጥ", "ኪራዩን ጀምር", "415.00 ብር", "730.00 ብር", "ትዕዛዝ paid-000"]) assert.ok(html.includes(text), text);
  for (const english of ["Awaiting confirmation", "Confirm booking", "Start rental", "ETB 415.00", "Refresh bookings"]) assert.ok(!html.includes(english), english);
});

test("the photo manager renders in Amharic", () => {
  const html = inAmharic(React.createElement(ListingPhotoView, { photos: [], loading: false, busy: false, ready: true, error: "", active: true,
    pendingDelete: null, onDelete() {}, onCancelDelete() {}, onConfirmDelete() {}, onRefresh() {}, onUpload() {}, onCover() {} }));
  assert.ok(html.includes("የዝርዝር ፎቶዎች")); assert.ok(html.includes("እስካሁን የተሰቀለ ፎቶ የለም።"));
  assert.ok(!html.includes("No uploaded photos yet"));
});

test("staff availability reads in Amharic, and English is unchanged", () => {
  const member = { id: "m1", name: "Sara", role: "Decorator", skills: [] };
  const schedule = { staff: [member], timeOff: [], bookings: [
    { id: "b1", startDate: "2026-12-03", endDate: "2026-12-03", status: "CONFIRMED", staff: ["m1"], itemIds: [] },
    { id: "b2", startDate: "2026-12-03", endDate: "2026-12-03", status: "PAID", staff: ["m1"], itemIds: [] }] };
  assert.equal(staff.availability(member, schedule, "new", "2026-12-03", "2026-12-03").detail, "On 2 other bookings");
  assert.equal(staff.availability(member, schedule, "new", "2026-12-03", "2026-12-03", "am").detail, "በ2 ሌሎች ትዕዛዞች ላይ");
  assert.equal(staff.availability(member, schedule, "new", "2026-12-09", "2026-12-09", "am").detail, "ይገኛል");
});

test("our own validation errors keep English text but carry the key screens translate", () => {
  try { validatePhoto({ size: 10, type: "image/gif" }); assert.fail("should throw"); }
  catch (cause) {
    assert.ok(cause instanceof TextError);
    assert.equal(cause.message, "Choose a PNG or JPEG photo.");
    assert.equal(translate("am", cause.key), "PNG ወይም JPEG ፎቶ ይምረጡ።");
  }
});
