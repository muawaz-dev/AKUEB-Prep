import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// In-memory only, and NOT actually shared across instances on this
// deployment - this app runs as Vercel serverless functions, not a single
// persistent process, so this limiter's real-world effectiveness is weaker
// than its limit numbers suggest (a request landing on a different warm
// instance gets a fresh bucket). Known, accepted limitation for now since
// this only guards the admin login form; swap for a shared store (e.g. a
// Postgres-backed counter, or Upstash Redis) if that stops being true.
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
