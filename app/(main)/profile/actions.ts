"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || null;
  const classIdRaw = String(formData.get("classId") ?? "").trim();
  const classId = classIdRaw || null;

  if (classId) {
    const exists = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
    if (!exists) throw new Error("Invalid class");
  }

  await prisma.user.update({ where: { id: user.id }, data: { name, classId } });
  revalidatePath("/profile");
}

export type ChapterOverview = {
  chapterId: string;
  title: string;
  orderIndex: number;
  attempted: number;
  solved: number;
  accuracy: number | null;
};

// Per-chapter accuracy (solved / attempted questions) for one subject,
// scoped to the user's own selected class - a Subject like Mathematics
// spans multiple classes with entirely different chapters, so this is only
// meaningful once pinned to one. Chapters the user hasn't attempted at all
// still appear (accuracy: null) so the dashboard shows full subject
// coverage, not just what's been practiced.
export async function getSubjectOverview(subjectId: string): Promise<ChapterOverview[]> {
  const user = await requireUser();
  if (!user.classId) throw new Error("Set your class first");

  const chapters = await prisma.chapter.findMany({
    where: { subjectId, classId: user.classId, status: "PUBLISHED" },
    orderBy: { orderIndex: "asc" },
    select: { id: true, title: true, orderIndex: true },
  });

  const attempts = await prisma.questionAttempt.findMany({
    where: { userId: user.id, question: { subjectId, classId: user.classId } },
    select: { solved: true, question: { select: { chapterId: true } } },
  });

  const byChapter = new Map<string, { attempted: number; solved: number }>();
  for (const a of attempts) {
    const chapterId = a.question.chapterId;
    if (!chapterId) continue; // unattributed - excluded from the per-chapter breakdown
    const bucket = byChapter.get(chapterId) ?? { attempted: 0, solved: 0 };
    bucket.attempted++;
    if (a.solved) bucket.solved++;
    byChapter.set(chapterId, bucket);
  }

  return chapters
    .map((c) => {
      const bucket = byChapter.get(c.id);
      const attempted = bucket?.attempted ?? 0;
      const solved = bucket?.solved ?? 0;
      return {
        chapterId: c.id,
        title: c.title,
        orderIndex: c.orderIndex,
        attempted,
        solved,
        accuracy: attempted > 0 ? solved / attempted : null,
      };
    })
    .sort((a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1));
}
