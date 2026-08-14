-- Enable Row Level Security on every table as defense in depth.
-- No policies are defined: this app connects via Prisma using the
-- Supabase "postgres" role, which has BYPASSRLS, so app behavior is
-- unaffected. This only closes off Supabase's auto-exposed PostgREST
-- API (which we don't use) from reading/writing these tables.
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chapter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Slo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestAttemptAnswer" ENABLE ROW LEVEL SECURITY;
