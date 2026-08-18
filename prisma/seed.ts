import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type SloRow = {
  chapter_order: string;
  chapter_title: string;
  topic_code: string;
  topic_title: string;
  slo_code: string;
  slo_text: string;
  cognitive_level: string;
};

// Which CSV file feeds which course. Add an entry here for each new
// class/subject you seed later (e.g. 11 Physics, 12 Maths).
const COURSES = [
  {
    file: "akueb_fsc1_math_slo.csv",
    slug: "fsc1-maths",
    title: "FSc Part 1 - Mathematics",
    classLevel: 11,
    subject: "Mathematics",
  },
];

// The source CSV has a handful of rows where slo_text contains an unquoted
// comma, which splits it into an extra column. Since slo_text is always the
// second-to-last field and cognitive_level (last field) is a single letter
// code, any row longer than 7 fields can be repaired by rejoining every
// field between slo_code and cognitive_level back into one.
function repairRow(raw: string[]): string[] {
  if (raw.length <= 7) return raw;
  const [chapter_order, chapter_title, topic_code, topic_title, slo_code] = raw;
  const cognitive_level = raw[raw.length - 1];
  const slo_text = raw.slice(5, raw.length - 1).join(",");
  return [chapter_order, chapter_title, topic_code, topic_title, slo_code, slo_text, cognitive_level];
}

async function seedCourse(courseDef: (typeof COURSES)[number]) {
  const csvPath = join(__dirname, "seed-data", courseDef.file);
  const rawRows: string[][] = parse(readFileSync(csvPath, "utf-8"), {
    columns: false,
    skip_empty_lines: true,
    relax_column_count: true,
  });
  const rows: SloRow[] = rawRows
    .slice(1)
    .map(repairRow)
    .map((r) => ({
      chapter_order: r[0],
      chapter_title: r[1],
      topic_code: r[2],
      topic_title: r[3],
      slo_code: r[4],
      slo_text: r[5],
      cognitive_level: r[6],
    }));

  const [cls, subject] = await Promise.all([
    prisma.class.upsert({ where: { level: courseDef.classLevel }, update: {}, create: { level: courseDef.classLevel } }),
    prisma.subject.upsert({ where: { name: courseDef.subject }, update: {}, create: { name: courseDef.subject } }),
  ]);

  const course = await prisma.course.upsert({
    where: { slug: courseDef.slug },
    update: {
      title: courseDef.title,
      classId: cls.id,
      subjectId: subject.id,
    },
    create: {
      slug: courseDef.slug,
      title: courseDef.title,
      classId: cls.id,
      subjectId: subject.id,
      status: "DRAFT",
    },
  });

  const chapterCache = new Map<string, string>(); // chapter_order -> chapterId
  const topicCache = new Map<string, string>(); // `${chapterId}:${topic_code}` -> topicId

  let sloCount = 0;

  for (const row of rows) {
    const chapterOrder = Number(row.chapter_order);

    let chapterId = chapterCache.get(row.chapter_order);
    if (!chapterId) {
      const chapter = await prisma.chapter.upsert({
        where: { courseId_orderIndex: { courseId: course.id, orderIndex: chapterOrder } },
        update: { title: row.chapter_title },
        create: {
          courseId: course.id,
          classId: course.classId,
          subjectId: course.subjectId,
          orderIndex: chapterOrder,
          title: row.chapter_title,
          status: "DRAFT",
        },
      });
      chapterId = chapter.id;
      chapterCache.set(row.chapter_order, chapterId);
    }

    const topicKey = `${chapterId}:${row.topic_code}`;
    let topicId = topicCache.get(topicKey);
    if (!topicId) {
      // topic_code like "1.2" -> orderIndex 2, derived from the part after the dot
      const topicOrderIndex = Number(row.topic_code.split(".")[1]);
      const topic = await prisma.topic.upsert({
        where: { chapterId_code: { chapterId, code: row.topic_code } },
        update: { title: row.topic_title, orderIndex: topicOrderIndex },
        create: {
          chapterId,
          code: row.topic_code,
          orderIndex: topicOrderIndex,
          title: row.topic_title,
          status: "DRAFT",
        },
      });
      topicId = topic.id;
      topicCache.set(topicKey, topicId);
    }

    // slo_code like "1.2.3" -> orderIndex 3, derived from the part after the second dot
    const sloOrderIndex = Number(row.slo_code.split(".")[2]);
    await prisma.slo.upsert({
      where: { topicId_code: { topicId, code: row.slo_code } },
      update: {
        sloText: row.slo_text,
        cognitiveLevel: row.cognitive_level,
        orderIndex: sloOrderIndex,
      },
      create: {
        topicId,
        code: row.slo_code,
        orderIndex: sloOrderIndex,
        sloText: row.slo_text,
        cognitiveLevel: row.cognitive_level,
        status: "DRAFT",
      },
    });
    sloCount += 1;
  }

  console.log(
    `Seeded "${course.title}": ${chapterCache.size} chapters, ${topicCache.size} topics, ${sloCount} SLOs.`
  );
}

async function main() {
  for (const courseDef of COURSES) {
    await seedCourse(courseDef);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
