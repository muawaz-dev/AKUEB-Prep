"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pointsForAttempt } from "@/lib/points";

// Called whenever a Question-bank entry's check comes back correct.
// Logged-out callers just no-op here; already-solved questions are left
// untouched since a question can only ever be solved (and scored) once
// per user.
export async function recordSolvedQuestion(questionId: string, firstTryCorrect: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };

  const existing = await prisma.solvedQuestion.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });
  if (existing) return { ok: true as const, alreadySolved: true as const, pointsAwarded: 0 };

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { difficulty: true },
  });
  if (!question) return { ok: false as const };

  // Re-reads difficulty from the stored question rather than trusting a
  // client-supplied value, so points can't be inflated by claiming a
  // harder difficulty than the question was actually authored at.
  const pointsAwarded = pointsForAttempt(question.difficulty, firstTryCorrect);

  await prisma.solvedQuestion.create({
    data: { userId: user.id, questionId, pointsAwarded, firstTryCorrect },
  });

  revalidatePath("/profile");
  revalidatePath("/question-bank");

  return { ok: true as const, alreadySolved: false as const, pointsAwarded };
}
