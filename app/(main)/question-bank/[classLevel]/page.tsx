import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { resolveClass, classLevelToLabel } from "@/lib/slugs";
import { QuestionBankPageBody } from "@/components/question-bank/QuestionBankPageBody";
import { toQuestionDto } from "@/lib/questionDto";
import { buildFilterTree } from "@/lib/questionBankFilterTree";
import { buildWhere, buildOrderBy, toQueryString } from "@/lib/questionBankQuery";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";

export const revalidate = 3600;

const PAGE_SIZE = 15;

type ExtraParams = {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  sloId?: string;
  difficulty?: string;
  pastPaper?: string;
  questionType?: string;
  solved?: string;
  sort?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classLevel: string }>;
}): Promise<Metadata> {
  const { classLevel } = await params;
  const cls = await resolveClass(classLevel);
  if (!cls) return {};
  const classLabel = classLevelToLabel(cls.level);
  return {
    title: `AKUEB ${classLabel} Past Papers & Practice Questions`,
    description: `Practice AKUEB ${classLabel} chapter-wise MCQs and past papers online, across every subject, with instant grading.`,
  };
}

export default async function ClassQuestionBankPage({
  params,
  searchParams,
}: {
  params: Promise<{ classLevel: string }>;
  searchParams: Promise<ExtraParams>;
}) {
  const { classLevel } = await params;
  const extra = await searchParams;
  const cls = await resolveClass(classLevel);
  if (!cls) notFound();
  const classLabel = classLevelToLabel(cls.level);

  const fixed = { classId: cls.id };
  // Only resolved (and only then opts this render out of the ISR cache
  // `revalidate` above sets up, since it reads cookies) when a
  // solved-status filter is actually requested.
  const userId = extra.solved ? (await getCurrentUser())?.id : undefined;
  const where = buildWhere({ ...fixed, ...extra }, userId);
  const orderBy = buildOrderBy(extra.sort);

  const [filterSourceQuestions, rows] = await Promise.all([
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
      title={`${classLabel} Question Bank`}
      description="Practice questions across every subject for this class, or narrow down to one below."
      backHref="/question-bank"
      backLabel="Question Bank"
      classes={classes}
      pastPaperRows={pastPaperRows}
      initial={fixed}
      initialQuestions={initialQuestions}
      initialHasMore={initialHasMore}
      queryString={toQueryString({ ...fixed, ...extra })}
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "AKUEB Prep",
          description: `Free AKUEB ${classLabel} question bank, chapter-wise practice, and past papers across every subject.`,
        },
        breadcrumbJsonLd([
          { name: "Question Bank", url: "/question-bank" },
          { name: `${classLabel}`, url: `/question-bank/${classLevel}` },
        ]),
      ]}
    />
  );
}
