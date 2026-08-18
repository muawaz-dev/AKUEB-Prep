-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN     "topicId" TEXT;

-- CreateIndex
CREATE INDEX "ContentBlock_topicId_orderIndex_idx" ON "ContentBlock"("topicId", "orderIndex");

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A content block belongs to exactly one owner: an Slo (sub-lesson content),
-- a Chapter (unit intro), or a Topic (that topic's test) - replaces the
-- previous two-owner version of this constraint.
ALTER TABLE "ContentBlock" DROP CONSTRAINT "ContentBlock_exactly_one_owner";
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_exactly_one_owner"
  CHECK (("sloId" IS NOT NULL)::int + ("chapterId" IS NOT NULL)::int + ("topicId" IS NOT NULL)::int = 1);
