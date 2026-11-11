import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

// Exercises the production Next server against a local contract fixture, without
// merchant accounts, real credentials, or identity documents.
test("provider portal session and private document boundary", { timeout: 60000 }, async t => {
  const seen = [];
  let unavailable = false;
  let walletDashboardUnavailable = false;
  const providerId = "11111111-1111-4111-8111-111111111111";
  const submissionId = "22222222-2222-4222-8222-222222222222";
  const documentId = "33333333-3333-4333-8333-333333333333";
  const submission = { id: submissionId, providerId, status: "SUBMITTED", businessName: "Fixture Rentals", location: "Addis Ababa", bio: "Synthetic business", createdAt: "2026-01-01T00:00:00Z", reviewedBy: null, reviewedAt: null, reviewReason: null, documents: [{ id: documentId, type: "IDENTITY", contentType: "image/png", sizeBytes: 8, sha256: "0".repeat(64), createdAt: "2026-01-01T00:00:00Z", submitted: true }] };
  let verificationStatus = "PENDING_REVIEW";
  const mock = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    seen.push({ path: req.url, headers: req.headers, body: bytes });
    if (unavailable) { res.writeHead(503); res.end(); return; }
    res.setHeader("content-type", "application/json");
    if (["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh"].includes(req.url)) {
      const body = JSON.parse(bytes.toString());
      if (body.email === "bad@example.test" || (req.url.endsWith("refresh") && body.refreshToken !== "refresh-test")) {
        res.writeHead(401); res.end(JSON.stringify({ error: "Invalid credentials" })); return;
      }
      const admin = body.email === "admin@example.test";
      res.end(JSON.stringify({ userId: admin ? "admin-test" : "provider-test", role: admin ? "ADMIN" : body.email === "customer@example.test" ? "CUSTOMER" : "PROVIDER", accessToken: admin ? "access-admin" : "access-test", refreshToken: "refresh-test" })); return;
    }
    if (req.url.includes("/auth/")) { res.end(JSON.stringify({ message: "Accepted" })); return; }
    if (!["Bearer access-test", "Bearer access-admin"].includes(req.headers.authorization)) { res.writeHead(401); res.end('{"error":"Unauthorized"}'); return; }
    if (req.url === "/api/v1/wallet/provider/dashboard") {
      if (walletDashboardUnavailable) { res.writeHead(503); res.end('{"error":"Ledger unavailable"}'); return; }
      res.end(JSON.stringify({ availableMinor: "3500", heldEarningsMinor: "1200", releasedEarningsMinor: "3000", currency: "ETB", asOf: "2026-01-01T12:00:00Z" })); return;
    }
    if (req.url === "/api/v1/bookings") {
      res.end(JSON.stringify([{ bookingId: "booking-1", customerId: "customer-1", status: "EXPIRED", startDate: "2026-12-01", endDate: "2026-12-03", totalMinor: 12345, currency: "ETB" }])); return;
    }
    if (req.url === "/api/v1/catalog/provider/items") {
      res.end(JSON.stringify([{ id: "listing-1", quantityAvailable: 7, imageUrls: [] }])); return;
    }
    if (req.url === "/api/v1/bookings/booking-1/status") {
      res.writeHead(409); res.end(JSON.stringify({ detail: "Invalid transition from EXPIRED to CONFIRMED" })); return;
    }
    if (req.url === "/api/v1/bookings/booking-1/change-requests") {
      res.end(JSON.stringify([{ id: "change-1", request_type: "CANCELLATION", status: "OPEN", requested_role: "CUSTOMER", reason: "Venue unavailable", requested_start_date: null, requested_end_date: null }])); return;
    }
    if (req.url === "/api/v1/bookings/provider/dashboard") {
      res.end(JSON.stringify({ counts: { totalBookings: 3, awaitingPayment: 0, awaitingConfirmation: 1, currentRentals: 1, completed: 0, changeRequests: 0, closed: 1, other: 0, asOf: "2026-01-01T12:00:00Z" }, recentActivity: [] })); return;
    }
    if (req.url === `/api/v1/providers/${providerId}`) { res.end(JSON.stringify({ providerId, businessName: submission.businessName, location: submission.location, bio: submission.bio, verificationStatus })); return; }
    if (req.url === `/api/v1/providers/${providerId}/kyc/submissions/${submissionId}`) { res.end(JSON.stringify(submission)); return; }
    if (req.url.endsWith("/content")) {
      res.setHeader("content-type", "image/png");
      res.setHeader("content-disposition", 'attachment; filename="evidence.png"');
      res.end(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); return;
    }
    res.end(JSON.stringify({ ok: true }));
  });
  mock.listen(0, "127.0.0.1"); await once(mock, "listening");
  const mockPort = mock.address().port;
  const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  let logs = "";
  const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: process.cwd(), env: { ...process.env, KITE_API_BASE_URL: `http://127.0.0.1:${mockPort}` }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  next.stdout.on("data", chunk => { logs += chunk; }); next.stderr.on("data", chunk => { logs += chunk; });
  const jar = new Map();
  const call = async (path, { method = "GET", body, headers, cookies = true, requestOrigin = origin } = {}) => {
    const response = await fetch(`${origin}${path}`, { method, body, redirect: "manual", headers: { ...(method !== "GET" ? { Origin: requestOrigin } : {}), ...(cookies ? { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") } : {}), ...headers } });
    if (cookies) for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(";"); const index = pair.indexOf("=");
      if (/max-age=0/i.test(value)) jar.delete(pair.slice(0, index)); else jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  };
  const post = (path, body, options = {}) => call(`/api/backend/${path}`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, ...options });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`${origin}/auth/login`)).ok) { ready = true; break; } } catch { /* starting */ }
      if (next.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Next server failed to start: ${logs}`);
    await t.test("anonymous portal access redirects and protected API fails closed", async () => {
      assert.equal((await call("/verification")).status, 307);
      assert.equal((await call("/api/backend/providers/me/kyc")).status, 401);
    });
    await t.test("cross-origin and missing-origin mutations never reach gateway", async () => {
      const count = seen.length;
      assert.equal((await post("auth/login", {}, { requestOrigin: "https://other.example" })).status, 403);
      assert.equal((await fetch(`${origin}/api/backend/auth/login`, { method: "POST" })).status, 403);
      assert.equal(seen.length, count);
    });
    await t.test("invalid credentials fail; customer and administrator sessions are revoked", async () => {
      assert.equal((await post("auth/login", { email: "bad@example.test" })).status, 401);
      for (const email of ["customer@example.test", "admin@example.test"]) {
        const before = seen.filter(r => r.path === "/api/v1/auth/logout").length;
        const response = await post("auth/login", { email });
        assert.equal(response.status, 403);
        assert.equal((await response.json()).error, "A provider account is required for this portal");
        assert.equal(seen.filter(r => r.path === "/api/v1/auth/logout").length, before + 1);
        assert.ok(!jar.has("kite_access"));
      }
    });
    await t.test("OTP and registration share a server-owned fingerprint; tokens stay HTTP-only", async () => {
      await post("auth/otp/send", { phone: "+251900000000" });
      await post("auth/otp/verify", { phone: "+251900000000", code: "123456" });
      const response = await post("auth/register", { email: "provider@example.test", role: "PROVIDER" });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { userId: "provider-test", role: "PROVIDER" });
      for (const name of ["kite_access", "kite_refresh", "kite_device"]) {
        const cookie = response.headers.getSetCookie().find(value => value.startsWith(`${name}=`));
        assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=strict/i);
      }
      const fingerprints = seen.filter(r => /\/auth\/(otp|register)/.test(r.path)).map(r => r.headers["x-session-fingerprint"]);
      assert.equal(new Set(fingerprints).size, 1);
      assert.equal((await call("/verification")).status, 200);
    });
    await t.test("identity and authorization headers cannot be supplied by clients", async () => {
      assert.equal((await call("/api/backend/providers/me/kyc", { headers: { "X-User-Id": "victim", Authorization: "Bearer forged", "X-Gateway-Token": "forged" } })).status, 200);
      const sent = seen.at(-1);
      assert.equal(sent.headers.authorization, "Bearer access-test");
      assert.equal(sent.headers["x-user-id"], undefined); assert.equal(sent.headers["x-gateway-token"], undefined);
    });
    await t.test("refresh uses cookie token, ignoring browser payload", async () => {
      assert.equal((await post("auth/refresh", { refreshToken: "forged" })).status, 200);
      assert.equal(JSON.parse(seen.at(-1).body).refreshToken, "refresh-test");
    });
    await t.test("dashboard requests carry the session identity and keep ledger failures separate", async () => {
      const wallet = await call("/api/backend/wallet/provider/dashboard", { headers: { "X-User-Id": "victim" } });
      assert.equal(wallet.status, 200); assert.equal((await wallet.json()).heldEarningsMinor, "1200");
      assert.match(wallet.headers.get("cache-control"), /no-store/);
      assert.equal(seen.at(-1).headers["x-user-id"], undefined);
      walletDashboardUnavailable = true;
      try {
        assert.equal((await call("/api/backend/wallet/provider/dashboard")).status, 503);
        const bookings = await call("/api/backend/bookings/provider/dashboard");
        assert.equal(bookings.status, 200); assert.equal((await bookings.json()).counts.closed, 1);
      } finally { walletDashboardUnavailable = false; }
    });
    await t.test("orders preserve terminal statuses, conflict responses and explicit change decisions through the session proxy", async () => {
      const bookings = await call("/api/backend/bookings");
      assert.equal((await bookings.json())[0].status, "EXPIRED");
      assert.match(bookings.headers.get("cache-control"), /no-store/);
      const conflict = await call("/api/backend/bookings/booking-1/status", { method: "PATCH", body: JSON.stringify({ status: "CONFIRMED" }), headers: { "Content-Type": "application/json", "X-User-Id": "victim" } });
      assert.equal(conflict.status, 409); assert.match((await conflict.json()).detail, /EXPIRED/);
      assert.equal(seen.at(-1).headers.authorization, "Bearer access-test");
      assert.equal(seen.at(-1).headers["x-user-id"], undefined);
      const changes = await call("/api/backend/bookings/booking-1/change-requests");
      assert.equal((await changes.json())[0].reason, "Venue unavailable");
      assert.equal((await post("bookings/booking-1/change-requests/change-1/resolve", { approved: false, note: "Retain agreed booking" })).status, 200);
      assert.deepEqual(JSON.parse(seen.at(-1).body), { approved: false, note: "Retain agreed booking" });
    });
    await t.test("multipart evidence and idempotency keys survive proxying", async () => {
      const form = new FormData(); form.set("type", "IDENTITY"); form.set("file", new Blob([Buffer.from([1, 2, 3])], { type: "image/png" }), "fixture.png");
      assert.equal((await call("/api/backend/providers/me/kyc/documents", { method: "POST", body: form })).status, 200);
      assert.match(seen.at(-1).headers["content-type"], /^multipart\/form-data; boundary=/);
      assert.ok(seen.at(-1).body.includes(Buffer.from("IDENTITY")));
      await post("providers/me/kyc/submissions", { documentIds: ["fixture"] }, { headers: { "Content-Type": "application/json", "Idempotency-Key": "submission-retry" } });
      assert.equal(seen.at(-1).headers["idempotency-key"], "submission-retry");
    });
    await t.test("listing photo multipart and order/delete calls use the authenticated session proxy", async () => {
      const inventory = await call("/api/backend/catalog/provider/items");
      assert.equal((await inventory.json())[0].quantityAvailable, 7);
      const form = new FormData(); form.set("file", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "fixture.png");
      assert.equal((await call("/api/backend/catalog/items/listing-1/images", { method: "POST", body: form, headers: { "X-User-Id": "victim" } })).status, 200);
      assert.match(seen.at(-1).headers["content-type"], /^multipart\/form-data; boundary=/);
      assert.equal(seen.at(-1).headers["x-user-id"], undefined);
      assert.equal(seen.at(-1).headers.authorization, "Bearer access-test");
      assert.equal((await call("/api/backend/catalog/items/listing-1/images/order", { method: "PUT", body: JSON.stringify({ imageIds: ["photo-1"] }), headers: { "Content-Type": "application/json" } })).status, 200);
      assert.deepEqual(JSON.parse(seen.at(-1).body), { imageIds: ["photo-1"] });
      assert.equal((await call("/api/backend/catalog/items/listing-1/images/photo-1", { method: "DELETE" })).status, 200);
    });
    await t.test("private downloads preserve bytes and are never cached", async () => {
      const response = await call("/api/backend/providers/me/kyc/documents/fixture/content");
      assert.equal(response.headers.get("content-type"), "image/png");
      assert.match(response.headers.get("cache-control"), /no-store/);
      assert.match(response.headers.get("content-disposition"), /^attachment/);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    });
    await t.test("oversized streamed uploads are rejected before reaching the gateway", async () => {
      const count = seen.length;
      async function* chunks() { for (let i = 0; i < 7; i++) yield Buffer.alloc(1024 * 1024); }
      const response = await fetch(`${origin}/api/backend/providers/me/kyc/documents`, { method: "POST", headers: { Origin: origin, Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), "Content-Type": "application/octet-stream" }, body: chunks(), duplex: "half" });
      assert.equal(response.status, 413);
      assert.match(response.headers.get("cache-control"), /no-store/);
      await response.arrayBuffer();
      assert.equal(seen.length, count);
    });
    await t.test("arbitrary targets and unexposed authentication actions are rejected", async () => {
      assert.equal((await call("/api/backend/internal/secrets")).status, 404);
      assert.equal((await post("auth/sessions/revoke-others", {})).status, 404);
    });
    await t.test("admin KYC, dispute and settlement routes never leave the portal, even with forged role headers", async () => {
      const count = seen.length;
      for (const path of ["providers/kyc/review-queue", `providers/${providerId}/kyc/submissions/${submissionId}`, `providers/${providerId}/kyc/documents/${documentId}/content`, "bookings/disputes", "bookings/policies/audit"]) {
        const response = await call(`/api/backend/${path}`, { headers: { "X-User-Role": "ADMIN" } });
        assert.equal(response.status, 404, path);
      }
      for (const path of [`providers/${providerId}/kyc/submissions/${submissionId}/review`, `providers/${providerId}/kyc/revoke`, "bookings/booking-1/disputes/dispute-1/resolve", "bookings/booking-1/settlement-approval", "bookings/booking-1/deposit-claim"]) {
        assert.equal((await post(path, { reason: "forged" })).status, 404, path);
      }
      assert.equal((await call("/api/backend/bookings/policies/platform", { method: "PUT", body: "{}", headers: { "Content-Type": "application/json" } })).status, 404);
      assert.equal(seen.length, count);
      assert.equal((await call("/api/backend/providers/me/kyc")).status, 200);
    });
    await t.test("administration routes are not part of the provider portal", async () => {
      const count = seen.length;
      for (const service of ["auth", "providers", "catalog", "bookings", "wallet", "payments", "notifications", "reviews"]) {
        assert.equal((await call(`/api/backend/${service}/admin/audit?limit=2`)).status, 404);
        assert.equal((await call(`/api/backend/${service}/admin/audit/status`)).status, 404);
      }
      assert.equal(seen.length, count);
      for (const screen of ["/admin/kyc", "/admin/disputes", "/admin/audit"]) {
        assert.equal((await call(screen)).status, 404);
      }
      assert.equal((await call("/api/backend/payments/intents")).status, 404);
    });
    await t.test("logout clears cookies even when the gateway is unavailable", async () => {
      unavailable = true;
      assert.equal((await post("auth/logout", {})).status, 200);
      assert.ok(!jar.has("kite_access")); assert.ok(!jar.has("kite_refresh"));
      assert.equal((await call("/verification")).status, 307);
    });
  } finally {
    next.kill();
    if (next.exitCode === null) await once(next, "exit");
    mock.closeAllConnections(); await new Promise(resolve => mock.close(resolve));
  }
});
