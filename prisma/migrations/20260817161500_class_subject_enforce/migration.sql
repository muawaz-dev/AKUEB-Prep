-- Step 2 of the Class/Subject normalization: locks down what the previous
-- migration backfilled (verified with zero nulls beforehand) and drops the
-- now-redundant free-text columns.

-- Course
ALTER TABLE "Course" ALTER COLUMN "classId" SET NOT NULL;
ALTER TABLE "Course" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Course" ADD CONSTRAINT "Course_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"(id) ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON UPDATE CASCADE;
ALTER TABLE "Course" DROP COLUMN "classLevel";
ALTER TABLE "Course" DROP COLUMN "subject";

-- Chapter: courseId becomes optional (deleting a Course now detaches its
-- chapters via SET NULL instead of cascading their deletion - see the model
-- comment in schema.prisma), classId/subjectId become the required anchor.
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_courseId_fkey";
ALTER TABLE "Chapter" ALTER COLUMN "courseId" DROP NOT NULL;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Chapter" ALTER COLUMN "classId" SET NOT NULL;
ALTER TABLE "Chapter" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"(id) ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON UPDATE CASCADE;

-- Question: classId/subjectId required; chapterId/topicId/sloId optional and
-- detach (rather than delete the question) if their target is removed.
ALTER TABLE "Question" ALTER COLUMN "classId" SET NOT NULL;
ALTER TABLE "Question" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Question" ADD CONSTRAINT "Question_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"(id) ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Question" ADD CONSTRAINT "Question_sloId_fkey" FOREIGN KEY ("sloId") REFERENCES "Slo"(id) ON UPDATE CASCADE ON DELETE SET NULL;
CREATE INDEX "Question_classId_subjectId_idx" ON "Question"("classId", "subjectId");
DROP INDEX "Question_classLevel_subject_idx";
ALTER TABLE "Question" DROP COLUMN "classLevel";
ALTER TABLE "Question" DROP COLUMN "subject";
ALTER TABLE "Question" DROP COLUMN "chapter";
ALTER TABLE "Question" DROP COLUMN "topic";
ALTER TABLE "Question" DROP COLUMN "slo";
