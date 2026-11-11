import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url), ts = require("typescript");
const saved = Object.fromEntries([".ts", ".tsx", ".css"].map(ext => [ext, require.extensions[ext]]));
const compile = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
require.extensions[".ts"] = compile; require.extensions[".tsx"] = compile;
require.extensions[".css"] = module => { module.exports = { __esModule: true, default: {} }; };
const load = path => require(fileURLToPath(new URL(path, import.meta.url)));
const { default: View } = load("../src/components/Listings/ListingPhotoView.tsx");
const { photoUrl, parsePhotos, validatePhoto, etbMinor } = load("../src/services/listing-photos.ts");
const { api } = load("../src/services/api.ts");
const { default: EditView } = load("../src/components/Listings/ListingEditView.tsx");
const { parseListingDetail, listingEditPayload } = load("../src/services/listing-edit.ts");
Object.assign(require.extensions, saved);
const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
const item = "11111111-1111-4111-8111-111111111111", id = "22222222-2222-4222-8222-222222222222";
const photo = { id, url: `/api/v1/catalog/items/${item}/images/${id}/content`, contentType: "image/png", width: 3, height: 2 };
const noop = () => {};
const detail = { id: item, name: "Chair", description: "Wooden chair", categoryId: "weddings", currency: "ETB", pricePerDayMinor: 10001,
  securityDepositMinor: 0, quantityAvailable: 4, active: true, revision: 7 };
function form() { const data = new FormData(); for (const [key, value] of Object.entries({ name: "Updated chair", description: "Updated description", category: "weddings", rate: "150.25", deposit: "50.10", stock: "5", active: "on" })) data.set(key, value); return data; }
const render = overrides => renderToStaticMarkup(React.createElement(View, { photos: [], loading: false, busy: false, ready: true, error: "", active: true,
  pendingDelete: null, onDelete: noop, onCancelDelete: noop, onConfirmDelete: noop, onRefresh: noop, onUpload: noop, onCover: noop, ...overrides }));

test("uploaded photos use the session proxy and unsafe media URLs are rejected", () => {
  assert.equal(photoUrl(photo.url), photo.url.replace("/api/v1/", "/api/backend/"));
  for (const url of ["javascript:alert(1)", "//foreign.example/photo.png", "/api/v1/providers/me/kyc", "data:image/svg+xml,hi"]) assert.equal(photoUrl(url), "");
  assert.throws(() => parsePhotos([{ ...photo, contentType: "image/svg+xml" }]));
  assert.equal(parsePhotos([photo])[0].url, photoUrl(photo.url));
});
test("photo upload validation and ETB amounts reject unsupported, oversized and rounded inputs", () => {
  validatePhoto({ size: 20, type: "image/jpeg" });
  for (const file of [{ size: 0, type: "image/png" }, { size: 2097153, type: "image/png" }, { size: 20, type: "image/svg+xml" }]) assert.throws(() => validatePhoto(file));
  assert.equal(etbMinor("100.01"), 10001);
  for (const value of ["0", "-1", "1.001", "abc", "9007199254740992"]) assert.throws(() => etbMinor(value));
});
test("loading and failed reads do not claim an empty gallery", () => {
  assert.ok(render({ loading: true, ready: false }).includes("Loading photos"));
  assert.ok(!render({ loading: true, ready: false }).includes("No uploaded photos yet"));
  assert.ok(!render({ ready: false, error: "Photos could not be loaded" }).includes("No uploaded photos yet"));
  assert.ok(render({}).includes("No uploaded photos yet"));
});
test("gallery shows actual dimensions, cover controls and confirmed deletion", () => {
  const html = render({ photos: parsePhotos([photo]), pendingDelete: id });
  for (const text of ["Cover photo", "3 x 2", "Remove this photo", "Keep photo", "/api/backend/catalog/"]) assert.ok(html.includes(text));
  assert.match(html, /disabled=""[^>]*>Make cover/);
});
test("inactive listing photos are not rendered as publicly visible", () => {
  const html = render({ photos: parsePhotos([photo]), active: false });
  assert.ok(html.includes("hidden from public view")); assert.ok(!html.includes("<img"));
});
test("five photos disable additional upload and busy state disables destructive actions", () => {
  const html = render({ photos: Array.from({ length: 5 }, (_, index) => ({ ...photo, id: String(index) })) });
  assert.match(html, /type="file"[^>]*disabled=""/);
  assert.match(render({ photos: parsePhotos([photo]), busy: true }), /disabled=""[^>]*>Delete photo/);
});
test("API uses owner-scoped inventory and preserves multipart, cover order and delete payloads", async () => {
  const original = globalThis.fetch, seen = [];
  globalThis.fetch = async (url, options) => {
    seen.push({ url, options });
    const value = url.endsWith("provider/items") ? [{ id: item, name: "Chair", categoryId: "weddings", pricePerDayMinor: 100, quantityAvailable: 7, active: true, imageUrls: [photo.url] }] : url.endsWith("/order") ? [photo] : {};
    return new Response(JSON.stringify(value), { status: 200 });
  };
  try {
    const listing = (await api.getListings())[0]; assert.equal(listing.stock, 7); assert.equal(listing.image, photoUrl(photo.url));
    await api.uploadListingPhoto(item, new File([new Uint8Array([1, 2])], "fixture.png", { type: "image/png" }));
    assert.ok(seen[1].options.body instanceof FormData); assert.ok(!("Content-Type" in seen[1].options.headers));
    await api.orderListingPhotos(item, [id]); assert.deepEqual(JSON.parse(seen[2].options.body), { imageIds: [id] });
    await api.deleteListingPhoto(item, id); assert.equal(seen[3].options.method, "DELETE");
  } finally { globalThis.fetch = original; }
});
test("listing edits preserve the loaded revision and exact price/deposit minor units", () => {
  const payload = listingEditPayload(parseListingDetail(detail), form());
  assert.equal(payload.expectedRevision, 7); assert.equal(payload.pricePerDayMinor, 15025); assert.equal(payload.securityDepositMinor, 5010);
  assert.equal(payload.quantityAvailable, 5); assert.equal(payload.active, true);
  assert.ok(!("imageUrls" in payload)); assert.ok(!("specs" in payload)); assert.ok(!("providerId" in payload));
  const freeDeposit = form(); freeDeposit.set("deposit", "0.00"); assert.equal(listingEditPayload(detail, freeDeposit).securityDepositMinor, 0);
});
test("stock reductions reach server validation while malformed listing inputs fail clearly", () => {
  const reduced = form(); reduced.set("stock", "0"); assert.equal(listingEditPayload(detail, reduced).quantityAvailable, 0);
  for (const [key, value] of [["stock", "-1"], ["stock", "5.5"], ["stock", "1000001"], ["rate", "1.001"], ["deposit", "-1"], ["name", "  "]]) {
    const values = form(); values.set(key, value); assert.throws(() => listingEditPayload(detail, values));
  }
  for (const patch of [{ revision: null }, { pricePerDayMinor: Number.MAX_SAFE_INTEGER + 1 }, { currency: "USD" }]) assert.throws(() => parseListingDetail({ ...detail, ...patch }));
});
test("edit view explains stock and booking rules and requires confirmation for availability changes", () => {
  const renderEdit = overrides => renderToStaticMarkup(React.createElement(EditView, { item: detail, categories: [{ id: "weddings", name: "Weddings" }], busy: false, conflict: false, pending: null, onSubmit: noop, onConfirm: noop, onBack: noop, ...overrides }));
  const html = renderEdit({});
  for (const text of ["Security deposit (ETB)", "Existing bookings keep their recorded amounts", "Booked units cannot be removed", 'value="100.01"', 'min="0"']) assert.ok(html.includes(text));
  const confirmation = renderEdit({ pending: { ...listingEditPayload(detail, form()), active: false } });
  assert.ok(confirmation.includes("Deactivate this listing?")); assert.ok(confirmation.includes("Confirm changes"));
  const reduction = renderEdit({ pending: { ...listingEditPayload(detail, form()), quantityAvailable: 0 } });
  assert.ok(reduction.includes("Reduce stock to 0?")); assert.ok(reduction.includes("cover all existing commitments"));
  assert.match(renderEdit({ conflict: true }), /<fieldset disabled=""/);
});
test("listing API uses PATCH and forwards revision conflicts without pretending success", async () => {
  const original = globalThis.fetch, seen = [];
  globalThis.fetch = async (url, options) => { seen.push({ url, options }); return new Response(JSON.stringify(detail), { status: 200 }); };
  try {
    const values = listingEditPayload(detail, form()); await api.editListing(item, values);
    assert.equal(seen[0].options.method, "PATCH"); assert.equal(seen[0].url, `/api/backend/catalog/items/${item}`);
    assert.deepEqual(JSON.parse(seen[0].options.body), values);
    globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Listing changed since it was loaded" }), { status: 409 });
    await assert.rejects(api.editListing(item, values), /Listing changed/);
  } finally { globalThis.fetch = original; }
});
