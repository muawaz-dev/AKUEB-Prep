"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus, QuestionType, Difficulty } from "@/app/generated/prisma/enums";
import type { Prisma } from "@/app/generated/prisma/client";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

// ---- SLOs ----

export async function createSlo(formData: FormData) {
  await requireAdmin();
  const topicId = field(formData, "topicId");
  const code = field(formData, "code");
  const sloText = field(formData, "sloText");
  const cognitiveLevel = field(formData, "cognitiveLevel");
  const orderIndex = Number(formData.get("orderIndex"));

  if (!topicId || !code || !sloText || !cognitiveLevel || !Number.isFinite(orderIndex)) {
    throw new Error("Missing or invalid fields");
  }

  const slo = await prisma.slo.create({
    data: { topicId, code, sloText, cognitiveLevel, orderIndex, status: "DRAFT" },
  });

  revalidatePath(`/admin/topics/${topicId}`);
  redirect(`/admin/slos/${slo.id}`);
}

export async function updateSlo(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const topicId = field(formData, "topicId");
  const code = field(formData, "code");
  const sloText = field(formData, "sloText");
  const cognitiveLevel = field(formData, "cognitiveLevel");
  const orderIndex = Number(formData.get("orderIndex"));
  const status = field(formData, "status") as ContentStatus;

  await prisma.slo.update({
    where: { id },
    data: { code, sloText, cognitiveLevel, orderIndex, status },
  });

  revalidatePath(`/admin/slos/${id}`);
  revalidatePath(`/admin/topics/${topicId}`);
}

export async function deleteSlo(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const topicId = field(formData, "topicId");

  await prisma.slo.delete({ where: { id } });

  revalidatePath(`/admin/topics/${topicId}`);
  redirect(`/admin/topics/${topicId}`);
}

// ---- Questions ----

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

export async function createQuestion(formData: FormData) {
  await requireAdmin();
  const sloId = field(formData, "sloId");
  const type = field(formData, "type") as QuestionType;
  const prompt = field(formData, "prompt");
  const difficulty = field(formData, "difficulty") as Difficulty;
  const explanation = field(formData, "explanation");

  await prisma.question.create({
    data: {
      sloId,
      type,
      prompt,
      difficulty,
      explanation: explanation || null,
      status: "DRAFT",
      data: buildQuestionData(type, formData),
    },
  });

  revalidatePath(`/admin/slos/${sloId}`);
}

export async function updateQuestion(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const sloId = field(formData, "sloId");
  const type = field(formData, "type") as QuestionType;
  const prompt = field(formData, "prompt");
  const difficulty = field(formData, "difficulty") as Difficulty;
  const status = field(formData, "status") as ContentStatus;
  const explanation = field(formData, "explanation");

  await prisma.question.update({
    where: { id },
    data: {
      type,
      prompt,
      difficulty,
      status,
      explanation: explanation || null,
      data: buildQuestionData(type, formData),
    },
  });

  revalidatePath(`/admin/slos/${sloId}`);
}

export async function deleteQuestion(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const sloId = field(formData, "sloId");

  await prisma.question.delete({ where: { id } });

  revalidatePath(`/admin/slos/${sloId}`);
}
