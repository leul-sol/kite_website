# Kite provider portal

This portal is for provider accounts only. Administrator work (KYC review, dispute
resolution, platform policy, settlement approval and the audit trail) lives in the
separate [kite_admin](../kite_admin/README.md) console. Customer and administrator
sign-ins are refused here, and the portal's backend proxy never forwards
administration endpoints, even though the gateway also enforces those roles.

The portal also includes owned setup showcases and photo management, confirmed
listing removal, provider analytics with CSV export, and provider disputes.
Private KYC evidence accepts bounded PDFs as well as images.
See [checkout-media-analytics.md](../kite_backend/docs/checkout-media-analytics.md)
for backend contracts, storage options and deployment requirements.

`/policies` shows the current platform policy and, when the platform enables it,
bounded provider customization. Existing bookings retain their original accepted
terms. See [business-policy-security.md](../kite_backend/docs/business-policy-security.md)
for the trust boundaries, consent contract and coordinated client/backend rollout.

The portal requires the running Kite gateway and its backend services. Configure
`KITE_API_BASE_URL` in `.env.local` (default `http://localhost:8080`), then run
`npm ci` and `npm run dev`. Backend requests go through the Next server; the browser
does not need gateway CORS access. The former `NEXT_PUBLIC_API_BASE_URL` and fixed
provider identity are no longer used.

For production, run `npm run build` and `npm start`, serve through HTTPS, and set
`KITE_PORTAL_ORIGIN` to the exact public origin, without a trailing slash, when using
a reverse proxy. Production cookies require HTTPS. Do not cache `/api/backend/*`
or authenticated portal pages at a CDN. Keep the gateway URL under deployment
control; do not point it at untrusted services or inject service credentials here.

## Authentication

Sign-in and provider registration call the backend. Registration requires phone
OTP verification in the same browser session and always requests the PROVIDER role.
Customer accounts cannot sign into this portal. Signup continues to `/verification`
to complete the business profile. Password reset includes both request and confirm
screens; the backend must have its delivery adapter configured for real delivery.
Development OTP behavior is controlled by the backend, not this portal.

Access and rotating refresh tokens are stored in HTTP-only, SameSite=Strict cookies,
with Secure enabled in production. API responses expose no tokens. Requests forward
only the server's bearer token and device fingerprint, never client identity headers.
Mutations require the exact same Origin. The gateway remains responsible for token
validation and authorization; the layout's cookie check is only a navigation guard.

On a protected API 401, the client refreshes and retries. Web Locks serialize refresh
across tabs where supported; an in-flight promise shares refresh within one tab as a
fallback. Logout revokes the refresh token when the gateway is reachable and clears
local session cookies even if the gateway is unavailable. Existing access JWTs expire
according to backend policy. Unavailable gateway logout cannot guarantee remote revocation.

## Provider verification

`/verification` supports business profile editing, PNG/JPEG uploads, authenticated
downloads, draft deletion, evidence selection, retry-safe submission, withdrawal,
and history/review reasons. Required evidence and limits come from the backend.
Changing approved business name/location requires review again. The backend freezes
those fields during a pending submission. Save profile edits before submitting;
submissions snapshot the stored profile. Submitted documents remain immutable.

Uploads require the backend's `KITE_KYC_ENCRYPTION_KEY_BASE64`. The portal shows an
unavailable state when uploads are disabled. Requests are capped at 6 MiB while
streaming through Next; individual evidence limits remain enforced by the backend.
Private API responses and downloads use no-store headers.

PDFs, object storage/CDN, real payout integration,
and deeper analytics remain separate work. Browser acceptance across the portal
also remains pending.

## Checks

The dashboard now uses provider-scoped booking and wallet endpoints. It distinguishes
available balance, held rental earnings and released booking credits, uses recorded
status activity, and handles loading/failure per section. It has no invented profile
visits, growth comparisons or revenue chart. See ../kite_backend/docs/provider-dashboard.md
for metric definitions, read snapshots and remaining limitations.

Run `npm run build`, then `npm run test:portal`. The integration test starts a
temporary production Next server and a localhost-only gateway fixture, then removes
both. It checks cookie/session boundaries, origin validation, identity header
stripping, refresh, multipart evidence, private downloads, and outage logout. It
also checks that administrator sign-ins are refused and that administration
endpoints and screens return 404 without reaching the gateway. The audit merge
tests moved to kite_admin with the audit viewer.
The production build and all 43 Node test results pass. The suite includes seven
React-rendered dashboard checks for money, raw-status, loading and partial-error
semantics, along with authenticated dashboard proxy checks. The suite
also includes eight order-board checks and a session-proxy order workflow check. It
adds seven listing-photo checks, four listing-edit checks and multipart/order/delete session-proxy coverage. It
uses synthetic data and does not exercise a live backend, delivery service, or
merchant account. Real-backend Chromium acceptance is available separately below.

The order board preserves all booking statuses, offers only supported provider
transitions, and reviews cancellations/reschedules through explicit change decisions.
Failed mutations reload server state; cancelled and expired bookings stay closed.
See ../kite_backend/docs/provider-orders.md for actions, checks and limitations.

## Listing photos

Create a listing with its real stock and daily ETB rate, then upload photos. Existing
listings have a Manage photos action in Inventory. You can upload up to five PNG/JPEG
photos (2 MiB each), make an uploaded photo the cover, and confirm removal. Upload
failure leaves the created listing available for retry. Inventory is scoped to your
own provider account and includes inactive listings. Photos for inactive listings
are not publicly served. Legacy external HTTPS images are preserved separately.

The backend stores processed photos in PostgreSQL; no object-store keys are needed.
See ../kite_backend/docs/listing-photos.md for API access, limits and remaining work.

## Browser acceptance

After `npm ci` and `npm run build`, run `npm run test:browser`. This requires the
same Docker images/current backend JARs as the integrated acceptance runner, Python,
and an installed Google Chrome. It starts an isolated real backend and temporary
production portal, uses synthetic accounts, and cleans up the temporary stack.
It does not connect to the normal Compose database or use merchant credentials.

Thirteen Chromium scenarios cover actual HTTP-only login cookies, listing creation,
photo upload/thumbnails, cover order, deletion/reload, failed-upload recovery, the
five-photo limit, editing rates/deposits/stock, activation confirmation, stale-tab
conflicts, confirmed zero-stock reduction, keyboard focus/Escape, a 390-pixel viewport, and logout. Native
listing dialogs contain focus and restore the opener; Escape/closing is disabled
during mutations. The inventory retains rows during refresh to preserve focus.

The production build, 45 portal test results and all 20 integrated acceptance groups
passed with browser checks enabled. Local reports and desktop/phone screenshots
are under ../kite_backend/.mvn/browser-acceptance/. Other browsers, other portal
workflows and actual Android/iOS behavior remain acceptance tasks. No Android/iOS
device or emulator was connected for this run; a phone-sized viewport is browser
coverage only.

## Listing editing

Use Edit listing in Inventory to change name, description, category, daily ETB rate,
deposit, stock capacity and active state. Stock reductions, activation and
deactivation require confirmation. Reductions are verified against booking
commitments; zero is allowed when nothing remains reserved. Existing bookings
retain their recorded amounts. See ../kite_backend/docs/stock-reductions.md for
capacity reconciliation and safe recovery after an uncertain save.

The editor checks the loaded revision before saving. After a conflict or uncertain
save, reload the listing before retrying; reloading replaces the unsaved draft.
Images, specifications, currency and provider identity are preserved. See
../kite_backend/docs/listing-management.md for API behavior and remaining limits.
