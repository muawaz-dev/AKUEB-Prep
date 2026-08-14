-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN     "chapterId" TEXT,
ALTER COLUMN "sloId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ContentBlock_chapterId_orderIndex_idx" ON "ContentBlock"("chapterId", "orderIndex");

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A content block belongs to exactly one owner: an Slo (sub-lesson content)
-- or a Chapter (unit intro), never both and never neither.
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_exactly_one_owner"
  CHECK (("sloId" IS NOT NULL)::int + ("chapterId" IS NOT NULL)::int = 1);
