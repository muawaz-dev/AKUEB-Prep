import { createHmac, timingSafeEqual } from "node:crypto";

// Pure, framework-free so it can be imported from both proxy.ts (which reads
// cookies off the raw request) and lib/adminAuth.ts (which uses next/headers).
export const ADMIN_COOKIE_NAME = "admin_session";

const SESSION_PAYLOAD = "admin-authenticated-v1";

export function signAdminSession(secret: string): string {
  return createHmac("sha256", secret).update(SESSION_PAYLOAD).digest("hex");
}

export function isValidAdminSessionToken(secret: string | undefined, token: string | undefined): boolean {
  if (!secret || !token) return false;
  const expected = Buffer.from(signAdminSession(secret), "hex");
  const actual = Buffer.from(token, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
