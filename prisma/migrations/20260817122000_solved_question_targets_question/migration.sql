-- SolvedQuestion now targets the Question test bank instead of ContentBlock
-- (see the "reuse ContentBlock" plan being reverted in favor of the
-- already-existing Question model). The table is unshipped/empty, so this
-- drops and recreates the relevant column rather than migrating data.
ALTER TABLE "SolvedQuestion" DROP CONSTRAINT "SolvedQuestion_contentBlockId_fkey";
DROP INDEX "SolvedQuestion_userId_contentBlockId_key";
ALTER TABLE "SolvedQuestion" RENAME COLUMN "contentBlockId" TO "questionId";
ALTER TABLE "SolvedQuestion" ADD CONSTRAINT "SolvedQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "SolvedQuestion_userId_questionId_key" ON "SolvedQuestion"("userId", "questionId");

-- Question bank additions
ALTER TABLE "Question" ADD COLUMN "pastPaper" TEXT;
