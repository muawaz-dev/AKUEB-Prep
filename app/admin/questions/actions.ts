"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus, QuestionType, Difficulty } from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function buildQuestionData(type: QuestionType, formData: FormData): Prisma.InputJsonValue {
  switch (type) {
    case "MCQ": {
      const choices = [
        field(formData, "choice0"),
        field(formData, "choice1"),
        field(formData, "choice2"),
        field(formData, "choice3"),
      ];
      const correctIndex = Number(formData.get("correctIndex"));
      return { choices, correctIndex: Number.isFinite(correctIndex) ? correctIndex : 0 };
    }
    case "NUMERIC": {
      const answer = Number(formData.get("answer"));
      const tolerance = Number(formData.get("tolerance"));
      return { answer: Number.isFinite(answer) ? answer : 0, tolerance: Number.isFinite(tolerance) ? tolerance : 0 };
    }
    case "SHORT_TEXT": {
      const acceptedAnswers = formData
        .getAll("acceptedAnswer")
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
      return { acceptedAnswers };
    }
    case "TRUE_FALSE": {
      const texts = formData.getAll("statementText").map(String);
      const isTrueValues = formData.getAll("statementIsTrue").map(String);
      const explanations = formData.getAll("statementExplanation").map(String);
      const statements = texts
        .map((text, i) => ({
          text: text.trim(),
          isTrue: isTrueValues[i] === "true",
          explanation: explanations[i]?.trim() || undefined,
        }))
        .filter((s) => s.text);
      return { statements };
    }
    case "FILL_IN_BLANK": {
      const segments = field(formData, "blankStatement").split(/_{3,}/g);
      const optionsPerBlank = formData.getAll("blankOptions").map(String);
      const answers = formData.getAll("blankAnswer").map(String);
      const blanks = answers.map((answer, i) => ({
        options: optionsPerBlank[i]
          ?.split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
        answer: answer.trim(),
      }));
      return { segments, blanks };
    }
  }
}

// Topic/SLO codes follow "N.M" / "N.M.P" (see prisma/seed.ts, which seeds
// them the same way) - the trailing segment already encodes the intended
// position, so deriving orderIndex from it keeps display order correct even
// when entries are added out of sequence (topic "1.5" added before "1.2"
// still sorts 1.2 before 1.5). Falls back to "next available" for a code
// that doesn't follow that pattern.
function orderIndexFromCode(code: string, fallbackMax: number): number {
  const lastSegment = code.split(".").at(-1) ?? "";
  const parsed = Number(lastSegment);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackMax + 1;
}

// Case-insensitive, trimmed lookup-or-create against a unique text column -
// "Mathematics" and "mathematics" (or a trailing space) resolve to the same
// row instead of silently forking into two. Whichever spelling was used
// first wins; later variants just match onto it rather than overwriting it.
async function findOrCreateSubject(name: string) {
  const existing = await prisma.subject.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  return existing ?? prisma.subject.create({ data: { name } });
}

// The admin still just types a class level, subject name, chapter title,
// topic code/title, and SLO code/text - same as before. Behind the scenes
// each one is resolved to a real Class/Subject/Chapter/Topic/Slo row,
// creating it on the fly (with courseId left null for Chapter, so no lesson
// content/Course is ever required) if nothing matching already exists. This
// is what gives Question real foreign keys instead of denormalized text,
// without losing the "just type it" flexibility. Matching is case-insensitive
// (see findOrCreateSubject) to guard against the most common typo classes -
// it doesn't catch a genuine misspelling like "Complex Numbr", which is why
// QuestionForm also offers autocomplete suggestions from what already exists.
async function resolveLocation(formData: FormData) {
  const classLevel = Number(formData.get("classLevel"));
  const subjectName = field(formData, "subject");
  const chapterTitle = field(formData, "chapter");
  const chapterOrderRaw = field(formData, "chapterOrder");
  const topicCode = field(formData, "topicCode");
  const topicTitle = field(formData, "topicTitle");
  const sloCode = field(formData, "sloCode");
  const sloText = field(formData, "sloText");
  const cognitiveLevel = field(formData, "cognitiveLevel");

  const [cls, subject] = await Promise.all([
    prisma.class.upsert({ where: { level: classLevel }, update: {}, create: { level: classLevel } }),
    findOrCreateSubject(subjectName),
  ]);

  let chapterId: string | null = null;
  if (chapterTitle) {
    const existing = await prisma.chapter.findFirst({
      where: { classId: cls.id, subjectId: subject.id, title: { equals: chapterTitle, mode: "insensitive" } },
    });
    if (existing) {
      chapterId = existing.id;
    } else {
      const maxOrder = await prisma.chapter.aggregate({
        where: { classId: cls.id, subjectId: subject.id },
        _max: { orderIndex: true },
      });
      const parsedOrder = Number(chapterOrderRaw);
      const created = await prisma.chapter.create({
        data: {
          classId: cls.id,
          subjectId: subject.id,
          title: chapterTitle,
          orderIndex: chapterOrderRaw && Number.isFinite(parsedOrder) ? parsedOrder : (maxOrder._max.orderIndex ?? 0) + 1,
          status: "DRAFT",
        },
      });
      chapterId = created.id;
    }
  }

  let topicId: string | null = null;
  if (chapterId && topicCode) {
    const existing = await prisma.topic.findFirst({ where: { chapterId, code: { equals: topicCode, mode: "insensitive" } } });
    if (existing) {
      topicId = existing.id;
    } else {
      const maxOrder = await prisma.topic.aggregate({ where: { chapterId }, _max: { orderIndex: true } });
      const created = await prisma.topic.create({
        data: {
          chapterId,
          code: topicCode,
          title: topicTitle || topicCode,
          orderIndex: orderIndexFromCode(topicCode, maxOrder._max.orderIndex ?? 0),
          status: "DRAFT",
        },
      });
      topicId = created.id;
    }
  }

  let sloId: string | null = null;
  if (topicId && sloCode) {
    const existing = await prisma.slo.findFirst({ where: { topicId, code: { equals: sloCode, mode: "insensitive" } } });
    if (existing) {
      sloId = existing.id;
    } else {
      const maxOrder = await prisma.slo.aggregate({ where: { topicId }, _max: { orderIndex: true } });
      const created = await prisma.slo.create({
        data: {
          topicId,
          code: sloCode,
          sloText: sloText || sloCode,
          cognitiveLevel: cognitiveLevel || "U",
          orderIndex: orderIndexFromCode(sloCode, maxOrder._max.orderIndex ?? 0),
          status: "DRAFT",
        },
      });
      sloId = created.id;
    }
  }

  return { classId: cls.id, subjectId: subject.id, chapterId, topicId, sloId };
}

export async function createQuestion(formData: FormData) {
  await requireAdmin();
  const type = field(formData, "type") as QuestionType;
  const prompt = field(formData, "prompt");
  const difficulty = field(formData, "difficulty") as Difficulty;
  const pastPaper = field(formData, "pastPaper");
  const imageUrl = field(formData, "imageUrl");
  const imageAlt = field(formData, "imageAlt");
  const explanation = field(formData, "explanation");
  const location = await resolveLocation(formData);

  await prisma.question.create({
    data: {
      classId: location.classId,
      subjectId: location.subjectId,
      chapterId: location.chapterId,
      topicId: location.topicId,
      sloId: location.sloId,
      type,
      prompt,
      difficulty,
      pastPaper: pastPaper || null,
      imageUrl: imageUrl || null,
      imageAlt: imageAlt || null,
      explanation: explanation || null,
      status: "DRAFT",
      data: buildQuestionData(type, formData),
    },
  });

  revalidatePath("/admin/questions");
}

export async function updateQuestion(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const type = field(formData, "type") as QuestionType;
  const prompt = field(formData, "prompt");
  const difficulty = field(formData, "difficulty") as Difficulty;
  const pastPaper = field(formData, "pastPaper");
  const imageUrl = field(formData, "imageUrl");
  const imageAlt = field(formData, "imageAlt");
  const status = field(formData, "status") as ContentStatus;
  const explanation = field(formData, "explanation");
  const location = await resolveLocation(formData);

  await prisma.question.update({
    where: { id },
    data: {
      classId: location.classId,
      subjectId: location.subjectId,
      chapterId: location.chapterId,
      topicId: location.topicId,
      sloId: location.sloId,
      type,
      prompt,
      difficulty,
      pastPaper: pastPaper || null,
      imageUrl: imageUrl || null,
      imageAlt: imageAlt || null,
      status,
      explanation: explanation || null,
      data: buildQuestionData(type, formData),
    },
  });

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");

  await prisma.question.delete({ where: { id } });

  revalidatePath("/admin/questions");
}
