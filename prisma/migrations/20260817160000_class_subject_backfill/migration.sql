-- Step 1 of the Class/Subject normalization: purely additive. Creates the
-- new tables, backfills them from the distinct values already present, and
-- adds the new FK columns everywhere as NULLABLE so the data can be verified
-- before anything old is dropped or made NOT NULL (see the follow-up
-- "class_subject_enforce" migration for that step).

CREATE TABLE "Class" (
  "id" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Class_level_key" ON "Class"("level");
ALTER TABLE "Class" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "Subject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;

INSERT INTO "Class" (id, level, "updatedAt")
SELECT gen_random_uuid()::text, level, now() FROM (
  SELECT "classLevel" AS level FROM "Course"
  UNION
  SELECT "classLevel" AS level FROM "Question"
) x;

INSERT INTO "Subject" (id, name, "updatedAt")
SELECT gen_random_uuid()::text, name, now() FROM (
  SELECT "subject" AS name FROM "Course"
  UNION
  SELECT "subject" AS name FROM "Question"
) x;

-- Course: nullable classId/subjectId for now
ALTER TABLE "Course" ADD COLUMN "classId" TEXT;
ALTER TABLE "Course" ADD COLUMN "subjectId" TEXT;
UPDATE "Course" c SET
  "classId" = (SELECT id FROM "Class" WHERE level = c."classLevel"),
  "subjectId" = (SELECT id FROM "Subject" WHERE name = c."subject");

-- Chapter: nullable classId/subjectId, backfilled from its (currently
-- always-present) parent Course
ALTER TABLE "Chapter" ADD COLUMN "classId" TEXT;
ALTER TABLE "Chapter" ADD COLUMN "subjectId" TEXT;
UPDATE "Chapter" ch SET
  "classId" = (SELECT "classId" FROM "Course" WHERE id = ch."courseId"),
  "subjectId" = (SELECT "subjectId" FROM "Course" WHERE id = ch."courseId");

-- Question: nullable classId/subjectId/chapterId/topicId/sloId. The
-- chapter/topic/slo text columns were normalized earlier this session to the
-- exact formats "Unit-{orderIndex} {title}", "{code} {title}", and "{code}"
-- respectively, so they can be matched back to real rows precisely.
ALTER TABLE "Question" ADD COLUMN "classId" TEXT;
ALTER TABLE "Question" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "Question" ADD COLUMN "chapterId" TEXT;
ALTER TABLE "Question" ADD COLUMN "topicId" TEXT;
ALTER TABLE "Question" ADD COLUMN "sloId" TEXT;

UPDATE "Question" q SET
  "classId" = (SELECT id FROM "Class" WHERE level = q."classLevel"),
  "subjectId" = (SELECT id FROM "Subject" WHERE name = q."subject");

UPDATE "Question" q SET "chapterId" = c.id
FROM "Chapter" c
WHERE c."classId" = q."classId"
  AND c."subjectId" = q."subjectId"
  AND ('Unit-' || c."orderIndex" || ' ' || c.title) = q.chapter;

UPDATE "Question" q SET "topicId" = t.id
FROM "Topic" t
JOIN "Chapter" c ON c.id = t."chapterId"
WHERE c."classId" = q."classId"
  AND c."subjectId" = q."subjectId"
  AND (t.code || ' ' || t.title) = q.topic;

UPDATE "Question" q SET "sloId" = s.id
FROM "Slo" s
JOIN "Topic" t ON t.id = s."topicId"
JOIN "Chapter" c ON c.id = t."chapterId"
WHERE c."classId" = q."classId"
  AND c."subjectId" = q."subjectId"
  AND s.code = q.slo;
