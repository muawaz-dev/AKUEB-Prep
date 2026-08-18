-- Question becomes fully independent of Course/Chapter/Topic/Slo: drop the
-- sloId relation and add plain classLevel/subject/chapter/topic/slo fields
-- instead, so a question can exist for a class/subject that has no matching
-- Course row at all. Table is empty in production so no data backfill is
-- needed for the new NOT NULL columns.
ALTER TABLE "Question" DROP CONSTRAINT "Question_sloId_fkey";
DROP INDEX "Question_sloId_idx";
ALTER TABLE "Question" DROP COLUMN "sloId";

ALTER TABLE "Question" ADD COLUMN "classLevel" INTEGER NOT NULL;
ALTER TABLE "Question" ADD COLUMN "subject" TEXT NOT NULL;
ALTER TABLE "Question" ADD COLUMN "chapter" TEXT NOT NULL;
ALTER TABLE "Question" ADD COLUMN "topic" TEXT NOT NULL;
ALTER TABLE "Question" ADD COLUMN "slo" TEXT NOT NULL;

CREATE INDEX "Question_classLevel_subject_idx" ON "Question"("classLevel", "subject");
