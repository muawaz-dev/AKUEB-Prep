"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { pointsForAttempt, fillBlankPoints } from "@/lib/points";
import { checkAnswer, type Submission, type CheckResult } from "@/lib/answerChecking";
import type { QuestionType } from "@/app/generated/prisma/enums";

export type CheckedAttempt = { pointsAwarded: number; solved: boolean; firstTryCorrect: boolean };

// The single source of truth for "is this answer right", and the only path
// that can ever mark a question attempted/solved. Grades server-side against
// the stored answer key (never sent to the browser - see
// lib/questionWidgetData.ts), then - for a logged-in caller - records the
// attempt in QuestionAttempt: a row is created the moment a question is
// first attempted at all (right or wrong), not just once it's solved, so
// "questions attempted" (see the profile page) reflects reality. First-try
// vs. retry credit is derived from whether a row already existed before this
// check, not from anything the client claims.
//
// FILL_IN_BLANK is the exception to the otherwise all-or-nothing grading:
// it awards partial credit per blank (see lib/points.ts's fillBlankPoints),
// and a row can keep gaining `correctBlanks`/`pointsAwarded` across several
// checks before `solved` ever becomes true - blanks correct on the very
// first check are frozen at full rate (`firstCheckBlankCount`), ones fixed
// on a later check top up at half rate. Every other type stays a single
// solved/unsolved flip, same as before.
export async function checkQuestionAnswer(
  questionId: string,
  type: QuestionType,
  submission: Submission
): Promise<{ result: CheckResult; explanation: string | null; attempt: CheckedAttempt | null }> {
  const question = await prisma.question.findUnique({
    where: { id: questionId, status: "PUBLISHED" },
    select: { type: true, data: true, difficulty: true, explanation: true },
  });
  if (!question || question.type !== type) throw new Error("Question not found");

  const result = checkAnswer(type, question.data as Record<string, unknown>, submission);

  // Explanation is withheld only until a real attempt has been made - not
  // withheld forever on a wrong one, and not gated on being logged in
  // either. "Show explanation" (see QuestionWidget) exists specifically for
  // wrong answers, so every caller gets it back regardless of what follows.
  const explanation = question.explanation;

  const user = await getCurrentUser();
  if (!user) return { result, explanation, attempt: null };

  const existing = await prisma.questionAttempt.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });

  // Nothing left to earn once every blank (or the whole question, for
  // every other type) has already been solved.
  if (existing?.solved) return { result, explanation, attempt: null };

  if (type === "FILL_IN_BLANK" && result.type === "FILL_IN_BLANK") {
    const totalBlanks = result.blanks.length;
    const priorCorrect = (existing?.correctBlanks as number[] | null) ?? [];
    const unionCorrect = Array.from(new Set([...priorCorrect, ...result.correctBlanks])).sort((a, b) => a - b);

    // No blank newly correct since the last check - nothing changed, skip
    // the write entirely.
    if (existing && unionCorrect.length === priorCorrect.length) {
      return { result, explanation, attempt: null };
    }

    const firstCheckBlankCount = existing?.firstCheckBlankCount ?? result.correctBlanks.length;
    const solved = unionCorrect.length === totalBlanks;
    const firstTryCorrect = solved && firstCheckBlankCount === totalBlanks;
    const pointsAwarded = fillBlankPoints(question.difficulty, totalBlanks, firstCheckBlankCount, unionCorrect.length);

    const row = await prisma.questionAttempt.upsert({
      where: { userId_questionId: { userId: user.id, questionId } },
      create: {
        userId: user.id,
        questionId,
        correctBlanks: unionCorrect,
        firstCheckBlankCount,
        solved,
        solvedAt: solved ? new Date() : null,
        pointsAwarded,
        firstTryCorrect,
      },
      update: { correctBlanks: unionCorrect, solved, solvedAt: solved ? new Date() : null, pointsAwarded, firstTryCorrect },
    });

    // Only a genuine full solve should evict the /question-bank ISR cache -
    // see the plan's performance note on why this stays gated this tightly.
    if (solved) {
      revalidatePath("/profile");
      revalidatePath("/question-bank");
    }

    return { result, explanation, attempt: { pointsAwarded: row.pointsAwarded, solved: row.solved, firstTryCorrect: row.firstTryCorrect } };
  }

  if (!result.correct) {
    // Record the attempt (so it counts toward "questions attempted") the
    // first time it's gotten wrong - a repeat wrong guess on a question
    // already known to be unsolved changes nothing, so skip the write.
    if (!existing) {
      await prisma.questionAttempt.create({ data: { userId: user.id, questionId, solved: false } });
    }
    return { result, explanation, attempt: null };
  }

  const firstTryCorrect = !existing;
  const pointsAwarded = pointsForAttempt(type, question.difficulty, firstTryCorrect);

  const row = await prisma.questionAttempt.upsert({
    where: { userId_questionId: { userId: user.id, questionId } },
    create: { userId: user.id, questionId, solved: true, solvedAt: new Date(), pointsAwarded, firstTryCorrect },
    update: { solved: true, solvedAt: new Date(), pointsAwarded, firstTryCorrect },
  });

  revalidatePath("/profile");
  revalidatePath("/question-bank");

  return { result, explanation, attempt: { pointsAwarded: row.pointsAwarded, solved: row.solved, firstTryCorrect: row.firstTryCorrect } };
}
