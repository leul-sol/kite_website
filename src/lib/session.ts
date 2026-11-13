import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

/**
 * The signed-in role, read from the access token for page routing only (providers to the
 * portal, team members to My work). It is not verified here: the gateway checks every API call.
 */
export function sessionRole(jar: ReadonlyRequestCookies): string | null {
  const token = jar.get("kite_access")?.value;
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
    return typeof payload.role === "string" ? payload.role.toUpperCase() : null;
  } catch {
    return null;
  }
}
