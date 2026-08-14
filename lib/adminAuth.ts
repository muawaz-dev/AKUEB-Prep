import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "node:crypto";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken, signAdminSession } from "./adminSessionToken";

export async function createAdminSession(): Promise<void> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, signAdminSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return isValidAdminSessionToken(secret, token);
}

export function verifyAdminPassword(candidate: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(adminPassword).digest();
  return timingSafeEqual(a, b);
}

// Every admin Server Action must call this first - proxy.ts gates page
// navigation, but Server Actions are their own POST endpoints and are not
// guaranteed to be covered by a proxy matcher (see Next.js docs on Proxy).
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized: admin session required");
  }
}
