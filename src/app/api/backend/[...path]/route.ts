import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const base = (process.env.KITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/" };
const names = { access: "kite_access", refresh: "kite_refresh", fingerprint: "kite_device" };
const publicActions = new Set(["login", "register", "otp/send", "otp/verify", "password/forgot", "password/reset/confirm"]);
// Administration endpoints belong to kite_admin. The gateway enforces roles too, but this
// portal never forwards them, so admin traffic cannot be routed through provider sessions.
const adminOnly: Array<[string | null, RegExp]> = [
  [null, /^[a-z]+\/admin(\/|$)/],
  [null, /^bookings\/disputes$/],
  [null, /^bookings\/[^/]+\/disputes\/[^/]+\/resolve$/],
  [null, /^bookings\/[^/]+\/settlement-approval$/],
  [null, /^bookings\/[^/]+\/deposit-claim$/],
  [null, /^bookings\/policies\/audit$/],
  ["PUT", /^bookings\/policies\/platform$/],
  [null, /^providers\/kyc\/review-queue$/],
  [null, /^providers\/(?!me\/)[^/]+\/kyc(\/|$)/],
];

async function handle(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const route = path.join("/");
  const mutates = !["GET", "HEAD"].includes(req.method);
  const expectedOrigin = process.env.KITE_PORTAL_ORIGIN ?? `${req.nextUrl.protocol}//${req.headers.get("host")}`;
  if (mutates && req.headers.get("origin") !== expectedOrigin) {
    return NextResponse.json({ error: "Request origin is not allowed" }, { status: 403 });
  }
  const authAction = route.startsWith("auth/") ? route.slice(5) : null;
  if (!/^(auth|catalog|bookings|wallet|providers|messages)(\/|$)/.test(route) || adminOnly.some(([method, pattern]) => (!method || method === req.method) && pattern.test(route)) || path.some(p => !/^[a-zA-Z0-9_-]+$/.test(p))) {
    return NextResponse.json({ error: "Unknown endpoint" }, { status: 404 });
  }
  if (authAction && (!publicActions.has(authAction) && !["refresh", "logout"].includes(authAction))) {
    return NextResponse.json({ error: "Unknown authentication action" }, { status: 404 });
  }
  if (authAction && req.method !== "POST") return new NextResponse(null, { status: 405 });
  const fingerprint = req.cookies.get(names.fingerprint)?.value ?? crypto.randomUUID();
  const headers = new Headers({ "X-Session-Fingerprint": fingerprint, "X-Device-Platform": "web", "X-Device-Model": "Kite provider portal" });
  for (const name of ["content-type", "idempotency-key"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!authAction) {
    const access = req.cookies.get(names.access)?.value;
    if (!access) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
    headers.set("Authorization", `Bearer ${access}`);
  }
  let body: BodyInit | undefined;
  if (mutates) {
    if (Number(req.headers.get("content-length")) > 6 * 1024 * 1024) return new NextResponse(null, { status: 413, headers: { Connection: "close" } });
    if (authAction === "refresh" || authAction === "logout") {
      body = JSON.stringify({ refreshToken: req.cookies.get(names.refresh)?.value ?? "" });
      headers.set("Content-Type", "application/json");
    } else {
      const reader = req.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 6 * 1024 * 1024) {
            await reader.cancel();
            return new NextResponse(null, { status: 413, headers: { Connection: "close" } });
          }
          chunks.push(value);
        }
      }
      body = Buffer.concat(chunks);
    }
  }
  const clear = (response: NextResponse) => {
    for (const name of [names.access, names.refresh]) response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
    return response;
  };
  try {
    const upstream = await fetch(`${base}/api/v1/${route}${req.nextUrl.search}`, { method: req.method, headers, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30000) });
    if (authAction === "logout") {
      return clear(NextResponse.json({ message: "Signed out" }));
    }
    if (["login", "register", "refresh"].includes(authAction ?? "") && upstream.ok) {
      const session = await upstream.json();
      // Administrators use kite_admin; this portal is for provider accounts only.
      if (session.role !== "PROVIDER") {
        await fetch(`${base}/api/v1/auth/logout`, { method: "POST", headers: { "Content-Type": "application/json", "X-Session-Fingerprint": fingerprint }, body: JSON.stringify({ refreshToken: session.refreshToken }), signal: AbortSignal.timeout(5000) }).catch(() => undefined);
        return clear(NextResponse.json({ error: "A provider account is required for this portal" }, { status: 403 }));
      }
      const response = NextResponse.json({ userId: session.userId, role: session.role });
      // Access cookies live as long as the refresh session; the gateway enforces JWT expiry.
      response.cookies.set(names.access, session.accessToken, { ...cookieOptions, maxAge: 2592000 });
      response.cookies.set(names.refresh, session.refreshToken, { ...cookieOptions, maxAge: 2592000 });
      response.cookies.set(names.fingerprint, fingerprint, { ...cookieOptions, maxAge: 2592000 });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    const resultHeaders = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
    for (const name of ["content-type", "content-disposition", "content-security-policy", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) resultHeaders.set(name, value);
    }
    const response = new NextResponse(upstream.body, { status: upstream.status, headers: resultHeaders });
    response.cookies.set(names.fingerprint, fingerprint, { ...cookieOptions, maxAge: 2592000 });
    return authAction === "refresh" && upstream.status === 401 ? clear(response) : response;
  } catch {
    if (authAction === "logout") return clear(NextResponse.json({ message: "Signed out locally" }));
    return NextResponse.json({ error: "The service is temporarily unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

async function routeHandler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const response = await handle(req, context);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
  return response;
}
export { routeHandler as GET, routeHandler as POST, routeHandler as PATCH, routeHandler as PUT, routeHandler as DELETE };
