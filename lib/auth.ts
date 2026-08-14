import "server-only";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

// Deliberately selects only app-specific fields - there's no passwordHash
// to worry about anymore (Supabase owns credentials in its own auth.users
// table), but keeping an explicit select here means this return value stays
// safe to read from Server Components even as more fields get added later.
const PROFILE_SELECT = { id: true, email: true, name: true, isAdmin: true, createdAt: true } as const;

export async function getCurrentUser() {
  const supabase = await createClient();
  // getClaims() verifies the JWT (locally against Supabase's published
  // signing keys where possible) rather than just trusting the cookie -
  // the currently-recommended way to check identity server-side.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const { sub: id, email } = data.claims;
  if (!id || !email) return null;

  const existing = await prisma.user.findUnique({ where: { id }, select: PROFILE_SELECT });
  if (existing) return existing;

  // First time we've seen this Supabase-authenticated user - create their
  // local profile row so UserProgress/TestAttempt foreign keys work as
  // normal Prisma relations.
  const metadata = data.claims.user_metadata as { name?: string; full_name?: string } | undefined;
  return prisma.user.create({
    data: { id, email, name: metadata?.name ?? metadata?.full_name ?? null },
    select: PROFILE_SELECT,
  });
}

// For Server Actions that require a logged-in student.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized: login required");
  return user;
}
