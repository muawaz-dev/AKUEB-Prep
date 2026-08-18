import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { QuestionWidget } from "@/components/lesson/QuestionWidget";
import { QuestionBankFilters } from "@/components/question-bank/QuestionBankFilters";
import { toWidgetData } from "@/lib/questionWidgetData";
import { buildFilterTree } from "@/lib/questionBankFilterTree";
import type { Prisma } from "@/app/generated/prisma/client";
import type { Difficulty } from "@/app/generated/prisma/enums";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  EASY: "border-green-600 text-green-700 dark:text-green-500",
  MEDIUM: "border-amber-600 text-amber-700 dark:text-amber-500",
  HARD: "border-red-600 text-red-700 dark:text-red-500",
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string;
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
    sloId?: string;
    difficulty?: string;
    pastPaper?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // Read once, unfiltered by the current selection, purely to derive every
  // filter dropdown's options from questions that actually exist - so no
  // combination offered ever dead-ends on "no questions match".
  const filterSourceQuestions = await prisma.question.findMany({
    where: { status: "PUBLISHED" },
    select: {
      pastPaper: true,
      class: { select: { id: true, level: true } },
      subject: { select: { id: true, name: true } },
      chapter: { select: { id: true, title: true, orderIndex: true } },
      topic: { select: { id: true, code: true, title: true, orderIndex: true } },
      slo: { select: { id: true, code: true, orderIndex: true } },
    },
  });

  const classes = buildFilterTree(filterSourceQuestions);
  const pastPaperRows = filterSourceQuestions
    .filter((q): q is typeof q & { pastPaper: string } => !!q.pastPaper)
    .map((q) => ({
      pastPaper: q.pastPaper,
      classId: q.class.id,
      subjectId: q.subject.id,
      chapterId: q.chapter?.id ?? null,
      topicId: q.topic?.id ?? null,
      sloId: q.slo?.id ?? null,
    }));

  const where: Prisma.QuestionWhereInput = { status: "PUBLISHED" };
  if (params.classId) where.classId = params.classId;
  if (params.subjectId) where.subjectId = params.subjectId;
  if (params.chapterId) where.chapterId = params.chapterId;
  if (params.topicId) where.topicId = params.topicId;
  if (params.sloId) where.sloId = params.sloId;
  if (params.difficulty) where.difficulty = params.difficulty as Difficulty;
  if (params.pastPaper) where.pastPaper = params.pastPaper;

  const orderBy: Prisma.QuestionOrderByWithRelationInput =
    params.sort === "oldest"
      ? { createdAt: "asc" }
      : params.sort === "easiest"
        ? { difficulty: "asc" }
        : params.sort === "hardest"
          ? { difficulty: "desc" }
          : { createdAt: "desc" };

  const questions = await prisma.question.findMany({
    where,
    orderBy,
    include: {
      class: true,
      subject: true,
      chapter: true,
      topic: true,
      slo: true,
    },
  });

  const solvedIds = user
    ? new Set(
        (
          await prisma.solvedQuestion.findMany({
            where: { userId: user.id, questionId: { in: questions.map((q) => q.id) } },
            select: { questionId: true },
          })
        ).map((s) => s.questionId)
      )
    : new Set<string>();

  return (
    <div className="max-w-4xl mx-auto w-full p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Question Bank</h1>
        <p className="text-base text-black/50 dark:text-white/50 mt-2">
          Practice questions pulled from across every class and subject. Filter by class, subject, chapter, topic,
          SLO, difficulty, or past paper.
        </p>
      </div>

      <QuestionBankFilters classes={classes} pastPaperRows={pastPaperRows} />

      <div className="flex flex-col gap-8">
        {questions.map((q, i) => {
          const breadcrumbParts = [
            `Class ${q.class.level} - ${q.subject.name}`,
            q.chapter ? `Unit ${q.chapter.orderIndex} - ${q.chapter.title}` : undefined,
            q.topic ? `${q.topic.code} ${q.topic.title}` : undefined,
            q.slo?.code,
          ].filter(Boolean);
          return (
            <div
              key={q.id}
              className={i < questions.length - 1 ? "pb-8 border-b-2 border-black/10 dark:border-white/10" : ""}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
                  {breadcrumbParts.join(" / ")}
                </span>
                <div className="flex items-center gap-2">
                  {q.pastPaper && (
                    <span className="text-xs font-medium rounded px-2 py-0.5 border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60">
                      {q.pastPaper}
                    </span>
                  )}
                  <span className={`text-xs font-medium rounded px-2 py-0.5 border ${DIFFICULTY_STYLES[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                  {solvedIds.has(q.id) && (
                    <span className="text-xs font-medium rounded px-2 py-0.5 border border-green-600 text-green-700 dark:text-green-500">
                      Solved
                    </span>
                  )}
                </div>
              </div>
              <QuestionWidget
                type={q.type}
                title={`Q${i + 1}`}
                imageUrl={q.imageUrl ?? undefined}
                imageAlt={q.imageAlt ?? undefined}
                prompt={q.prompt}
                data={toWidgetData(q.type, q.data as Record<string, unknown>)}
                explanation={q.explanation}
                questionId={q.id}
              />
            </div>
          );
        })}

        {questions.length === 0 && (
          <p className="text-base text-black/40 dark:text-white/40">No questions match these filters yet.</p>
        )}
      </div>
    </div>
  );
}
