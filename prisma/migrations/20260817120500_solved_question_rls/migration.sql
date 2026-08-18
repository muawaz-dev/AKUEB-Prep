-- Enable RLS as defense in depth, matching every other table (see the
-- 20260812204103_enable_rls migration) - Prisma connects via a role with
-- BYPASSRLS, so this only closes the table off from Supabase's PostgREST API.
ALTER TABLE "SolvedQuestion" ENABLE ROW LEVEL SECURITY;
