import "server-only";
import { prisma } from "./prisma";
import { createClient } from "./supabase/server";
import { Prisma } from "@/app/generated/prisma/client";

// Deliberately selects only app-specific fields - there's no passwordHash
// to worry about anymore (Supabase owns credentials in its own auth.users
// table), but keeping an explicit select here means this return value stays
// safe to read from Server Components even as more fields get added later.
const PROFILE_SELECT = { id: true, email: true, name: true, classId: true, isAdmin: true, createdAt: true } as const;

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
  // normal Prisma relations. Upsert (not create) because layout and page
  // Server Components both call getCurrentUser() in parallel for the same
  // request, and two concurrent creates for the same id would otherwise
  // race and throw a unique constraint error.
  const metadata = data.claims.user_metadata as { name?: string; full_name?: string } | undefined;
  try {
    return await prisma.user.upsert({
      where: { id },
      create: { id, email, name: metadata?.name ?? metadata?.full_name ?? null },
      update: {},
      select: PROFILE_SELECT,
    });
  } catch (err) {
    // The upsert's own race protection only covers a conflict on `id` (its
    // ON CONFLICT target) - it does NOT cover `email`'s separate unique
    // constraint, which fails here for two different reasons that both
    // resolve the same way:
    //  - Two parallel calls for the same brand-new user race each other
    //    into the insert; the winner's row satisfies the loser's own id too,
    //    so re-reading by email finds exactly the row this call meant to
    //    create.
    //  - A row already exists under a *different* id for this email (e.g.
    //    the Supabase auth user was deleted and re-created, so this login
    //    now presents a new `sub` for an email this table has already seen)
    //    - findUnique by `id` would find nothing here, which is what broke
    //    the earlier version of this fallback. That old row is what already
    //    holds this account's history (points, solved questions, progress),
    //    so it's used as-is rather than trying to migrate its primary key.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const byEmail = await prisma.user.findUnique({ where: { email }, select: PROFILE_SELECT });
      if (byEmail) return byEmail;
    }
    throw err;
  }
}

// For Server Actions that require a logged-in student.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized: login required");
  return user;
}
