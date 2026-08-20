import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Each Next.js build worker (and, in production, each server instance) gets
// its own pool via this module - the Supabase connection string in .env is
// the direct/session-mode one (max 15 clients total, see .env's comment on
// DATABASE_URL), not the transaction pooler. `next build` spreads work
// across several workers (7 here) that all load this module concurrently,
// so each one needs a small cap to stay under 15 combined - but the running
// server is a single process, so it can afford much more headroom for
// actual concurrent requests. NEXT_PHASE is set by Next.js only during the
// build step, which is what tells the two apart.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: isBuild ? 2 : 10 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
