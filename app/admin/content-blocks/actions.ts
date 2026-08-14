"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { BlockType, QuestionType } from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function buildQuestionBlockContent(formData: FormData): Prisma.InputJsonValue {
  const questionType = field(formData, "questionType") as QuestionType;
  const base = {
    questionType,
    title: field(formData, "title") || undefined,
    prompt: field(formData, "prompt"),
    explanation: field(formData, "explanation") || undefined,
  };

  switch (questionType) {
    case "MCQ": {
      const choices = [
        field(formData, "choice0"),
        field(formData, "choice1"),
        field(formData, "choice2"),
        field(formData, "choice3"),
      ];
      const correctIndex = Number(formData.get("correctIndex"));
      return { ...base, choices, correctIndex: Number.isFinite(correctIndex) ? correctIndex : 0 };
    }
    case "NUMERIC": {
      const answer = Number(formData.get("answer"));
      const tolerance = Number(formData.get("tolerance"));
      return { ...base, answer: Number.isFinite(answer) ? answer : 0, tolerance: Number.isFinite(tolerance) ? tolerance : 0 };
    }
    case "SHORT_TEXT": {
      // One acceptedAnswer field per row - see FILL_IN_BLANK below for the
      // same getAll() pattern.
      const acceptedAnswers = formData
        .getAll("acceptedAnswer")
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
      return { ...base, acceptedAnswers };
    }
    case "TRUE_FALSE": {
      // Rows share field names (statementText, statementIsTrue, ...) so any
      // number of them can be submitted - getAll() reads them back in the
      // same order they appear in the form.
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
      return { ...base, statements };
    }
    case "FILL_IN_BLANK": {
      // The statement is split on runs of 3+ underscores into the text
      // segments that surround each blank; blankOptions/blankAnswer rows
      // (one per blank, in order) carry each blank's config.
      const statementText = field(formData, "blankStatement");
      const segments = statementText.split(/_{3,}/g);
      const optionsPerBlank = formData.getAll("blankOptions").map(String);
      const answers = formData.getAll("blankAnswer").map(String);
      const blanks = answers.map((answer, i) => ({
        options: optionsPerBlank[i]
          ?.split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
        answer: answer.trim(),
      }));
      return { ...base, segments, blanks };
    }
  }
}

function buildBlockContent(blockType: BlockType, formData: FormData): Prisma.InputJsonValue {
  switch (blockType) {
    case "TEXT":
      return { text: field(formData, "text") };
    case "VIDEO":
      return { youtubeId: field(formData, "youtubeId"), caption: field(formData, "caption") || undefined };
    case "IMAGE":
      return {
        url: field(formData, "url"),
        alt: field(formData, "alt") || undefined,
        caption: field(formData, "caption") || undefined,
      };
    case "FORMULA":
      return { latex: field(formData, "latex"), caption: field(formData, "caption") || undefined };
    case "WORKED_EXAMPLE":
      return { problem: field(formData, "problem"), solution: field(formData, "solution") };
    case "CALLOUT":
      return { title: field(formData, "title") || undefined, text: field(formData, "text") };
    case "QUESTION":
      return buildQuestionBlockContent(formData);
  }
}

// A content block belongs to exactly one owner: an SLO (sub-lesson content)
// or a chapter (unit intro). Forms submit whichever id applies and leave the
// other blank; this reads both and revalidates the right owning admin page.
function ownerPath(sloId: string, chapterId: string): string {
  return sloId ? `/admin/slos/${sloId}` : `/admin/chapters/${chapterId}`;
}

export async function createContentBlock(formData: FormData) {
  await requireAdmin();
  const sloId = field(formData, "sloId");
  const chapterId = field(formData, "chapterId");
  const blockType = field(formData, "blockType") as BlockType;
  const orderIndex = Number(formData.get("orderIndex"));

  await prisma.contentBlock.create({
    data: {
      sloId: sloId || null,
      chapterId: chapterId || null,
      blockType,
      orderIndex: Number.isFinite(orderIndex) ? orderIndex : 0,
      content: buildBlockContent(blockType, formData),
    },
  });

  revalidatePath(ownerPath(sloId, chapterId));
}

export async function updateContentBlock(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const sloId = field(formData, "sloId");
  const chapterId = field(formData, "chapterId");
  const blockType = field(formData, "blockType") as BlockType;
  const orderIndex = Number(formData.get("orderIndex"));

  await prisma.contentBlock.update({
    where: { id },
    data: {
      blockType,
      orderIndex: Number.isFinite(orderIndex) ? orderIndex : 0,
      content: buildBlockContent(blockType, formData),
    },
  });

  revalidatePath(ownerPath(sloId, chapterId));
}

export async function deleteContentBlock(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const sloId = field(formData, "sloId");
  const chapterId = field(formData, "chapterId");

  await prisma.contentBlock.delete({ where: { id } });

  revalidatePath(ownerPath(sloId, chapterId));
}
