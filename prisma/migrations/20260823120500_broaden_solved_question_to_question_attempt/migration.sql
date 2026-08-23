-- SolvedQuestion only ever held rows for fully-solved questions. It's being
-- broadened to QuestionAttempt, which holds one row per (user, question)
-- from the very first attempt (right or wrong), so "questions attempted"
-- and per-blank partial credit (FILL_IN_BLANK) can be tracked. This is a
-- real rename (not a drop-and-recreate) so every existing solve survives.
ALTER TABLE "SolvedQuestion" RENAME TO "QuestionAttempt";

ALTER TABLE "QuestionAttempt" RENAME CONSTRAINT "SolvedQuestion_pkey" TO "QuestionAttempt_pkey";
ALTER TABLE "QuestionAttempt" RENAME CONSTRAINT "SolvedQuestion_userId_fkey" TO "QuestionAttempt_userId_fkey";
ALTER TABLE "QuestionAttempt" RENAME CONSTRAINT "SolvedQuestion_questionId_fkey" TO "QuestionAttempt_questionId_fkey";

ALTER INDEX "SolvedQuestion_userId_idx" RENAME TO "QuestionAttempt_userId_idx";
ALTER INDEX "SolvedQuestion_userId_questionId_key" RENAME TO "QuestionAttempt_userId_questionId_key";

ALTER TABLE "QuestionAttempt"
  ADD COLUMN "solved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "correctBlanks" JSONB,
  ADD COLUMN "firstCheckBlankCount" INTEGER;

ALTER TABLE "QuestionAttempt" ALTER COLUMN "solvedAt" DROP NOT NULL;
ALTER TABLE "QuestionAttempt" ALTER COLUMN "pointsAwarded" SET DEFAULT 0;
ALTER TABLE "QuestionAttempt" ALTER COLUMN "firstTryCorrect" SET DEFAULT false;

-- Every pre-existing row represents a real past solve under the old
-- (solved-only) semantics.
UPDATE "QuestionAttempt" SET "solved" = true;
