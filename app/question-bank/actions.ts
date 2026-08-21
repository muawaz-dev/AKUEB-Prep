"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pointsForAttempt } from "@/lib/points";
import { checkAnswer, type Submission, type CheckResult } from "@/lib/answerChecking";
import type { QuestionType } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";

// The single source of truth for "is this answer right", and the only path
// that can ever mark a question solved. Grades server-side against the
// stored answer key (never sent to the browser - see lib/questionDto.ts),
// then - only if that grading says correct, the caller is logged in, and
// this question hasn't already been solved by them - records the solve and
// awards points. A client can no longer claim a solve just by calling an
// action with a hand-picked boolean; it has to supply an answer that
// actually grades correct.
export async function checkQuestionAnswer(
  questionId: string,
  type: QuestionType,
  submission: Submission,
  hadWrongAttempt: boolean
): Promise<{ result: CheckResult; explanation: string | null; solved: { pointsAwarded: number } | null }> {
  const question = await prisma.question.findUnique({
    where: { id: questionId, status: "PUBLISHED" },
    select: { type: true, data: true, difficulty: true, explanation: true },
  });
  if (!question || question.type !== type) throw new Error("Question not found");

  const result = checkAnswer(type, question.data as Record<string, unknown>, submission);

  if (!result.correct) {
    return { result, explanation: null, solved: null };
  }

  const user = await getCurrentUser();
  if (!user) return { result, explanation: question.explanation, solved: null };

  // Re-derived from difficulty stored on the question rather than trusting a
  // client-supplied value, so points can't be inflated by claiming a harder
  // difficulty than the question was actually authored at. `hadWrongAttempt`
  // itself stays client-tracked (it only tiers the point award between full
  // and half credit, not whether the solve is recorded at all).
  const firstTryCorrect = !hadWrongAttempt;
  const pointsAwarded = pointsForAttempt(question.difficulty, firstTryCorrect);

  // create (not a find-then-create) so a duplicate/double-fired request for
  // the same question can't race past an "already solved?" check that ran
  // before either one had written anything - SolvedQuestion's only unique
  // constraint is exactly (userId, questionId), so a genuine duplicate just
  // fails with P2002 here instead of racing, and that's treated as "already
  // solved, nothing new to award" rather than a real error.
  try {
    await prisma.solvedQuestion.create({
      data: { userId: user.id, questionId, pointsAwarded, firstTryCorrect },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { result, explanation: question.explanation, solved: null };
    }
    throw err;
  }

  revalidatePath("/profile");
  revalidatePath("/question-bank");

  return { result, explanation: question.explanation, solved: { pointsAwarded } };
}
