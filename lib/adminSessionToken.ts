import { createHmac, timingSafeEqual, createHash } from "node:crypto";

// Pure, framework-free so it can be imported from both proxy.ts (which reads
// cookies off the raw request) and lib/adminAuth.ts (which uses next/headers).
export const ADMIN_COOKIE_NAME = "admin_session";

// Enforced inside the token itself, independent of the cookie's own Max-Age -
// a copied/replayed cookie value stops verifying after this long even if
// something strips the cookie's expiry attribute in transit.
export const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

// Mixing a hash of the admin password into the signing key means rotating
// ADMIN_PASSWORD invalidates every session token issued under the old one.
// Without this, a leaked session cookie would keep working for the rest of
// its 7 days even after the password was changed - the obvious response to
// "the password may have leaked" wouldn't actually revoke anything.
function sessionKey(secret: string, adminPassword: string): Buffer {
  return createHash("sha256").update(`${secret}:${adminPassword}`).digest();
}

export function signAdminSession(secret: string, adminPassword: string, issuedAt = Date.now()): string {
  const issuedAtPart = String(issuedAt);
  const mac = createHmac("sha256", sessionKey(secret, adminPassword)).update(issuedAtPart).digest("hex");
  return `${issuedAtPart}.${mac}`;
}

export function isValidAdminSessionToken(
  secret: string | undefined,
  adminPassword: string | undefined,
  token: string | undefined
): boolean {
  if (!secret || !adminPassword || !token) return false;

  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const issuedAtPart = token.slice(0, dot);
  const macPart = token.slice(dot + 1);

  const issuedAt = Number(issuedAtPart);
  const now = Date.now();
  // Rejects both expired tokens and ones claiming to be issued in the future
  // (which could only happen if the payload was tampered with, since a
  // genuine one is always stamped with the signing server's own clock).
  if (!Number.isFinite(issuedAt) || issuedAt > now || now - issuedAt > ADMIN_SESSION_TTL_MS) return false;

  const expected = createHmac("sha256", sessionKey(secret, adminPassword)).update(issuedAtPart).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(macPart, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
