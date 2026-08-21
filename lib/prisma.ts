import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// DATABASE_URL is Supabase's transaction-mode pooler (see .env's comment),
// which is designed for exactly this: many short-lived per-instance pools
// rather than one long-lived one. That matters because on Vercel each
// serverless invocation (and, during `next build`, each of its several
// build workers) can end up with its own instance of this module and its
// own pool - a single persistent server was never a safe assumption here.
// Kept conservative anyway since there's no real need for a large pool per
// instance. NEXT_PHASE is set by Next.js only during the build step, which
// is what tells build-time apart from a running request.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: isBuild ? 2 : 10 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
