import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { QuestionBankPageBody } from "@/components/question-bank/QuestionBankPageBody";
import { toQuestionDto } from "@/lib/questionDto";
import { buildFilterTree } from "@/lib/questionBankFilterTree";
import { buildWhere, buildOrderBy, toQueryString } from "@/lib/questionBankQuery";

const PAGE_SIZE = 15;

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
    questionType?: string;
    solved?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  // Only resolved (and only then opts this render out of caching, since it
  // reads cookies) when a solved-status filter is actually requested -
  // every other combination of filters stays cacheable.
  const userId = params.solved ? (await getCurrentUser())?.id : undefined;
  const where = buildWhere(params, userId);
  const orderBy = buildOrderBy(params.sort);

  // None of these two depend on each other's result, so they run concurrently.
  const [filterSourceQuestions, rows] = await Promise.all([
    // Read once, unfiltered by the current selection, purely to derive every
    // filter dropdown's options from questions that actually exist - so no
    // combination offered ever dead-ends on "no questions match".
    prisma.question.findMany({
      where: { status: "PUBLISHED" },
      select: {
        pastPaper: true,
        class: { select: { id: true, level: true } },
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, title: true, orderIndex: true } },
        topic: { select: { id: true, code: true, title: true, orderIndex: true } },
        slo: { select: { id: true, code: true, orderIndex: true } },
      },
    }),
    prisma.question.findMany({
      where,
      orderBy,
      take: PAGE_SIZE + 1,
      include: { class: true, subject: true, chapter: true, topic: true, slo: true },
    }),
  ]);

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

  const initialHasMore = rows.length > PAGE_SIZE;
  const initialQuestions = rows.slice(0, PAGE_SIZE).map(toQuestionDto);

  return (
    <QuestionBankPageBody
      title="Question Bank"
      description="Practice questions pulled from across every class and subject. Filter by class, subject, chapter, topic, SLO, difficulty, or past paper."
      classes={classes}
      pastPaperRows={pastPaperRows}
      initialQuestions={initialQuestions}
      initialHasMore={initialHasMore}
      queryString={toQueryString(params)}
    />
  );
}
