import { prisma } from "./prisma";

// Used only from client-triggered endpoints (/api/solved-status,
// /api/questions) - never called during a page's own server render, so
// "Solved" status never forces a page to be dynamically rendered per user.
export async function getSolvedIds(userId: string, questionIds: string[]): Promise<string[]> {
  if (questionIds.length === 0) return [];
  const rows = await prisma.solvedQuestion.findMany({
    where: { userId, questionId: { in: questionIds } },
    select: { questionId: true },
  });
  return rows.map((r) => r.questionId);
}
