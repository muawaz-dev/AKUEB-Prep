-- The student's self-selected grade level (profile page) - nullable since
-- existing users have none, and picking one is optional.
ALTER TABLE "User" ADD COLUMN "classId" TEXT;

CREATE INDEX "User_classId_idx" ON "User"("classId");

ALTER TABLE "User" ADD CONSTRAINT "User_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
