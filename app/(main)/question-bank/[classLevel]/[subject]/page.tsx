import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { resolveClassSubject, classLevelToLabel } from "@/lib/slugs";
import { QuestionBankPageBody } from "@/components/question-bank/QuestionBankPageBody";
import { toQuestionDto } from "@/lib/questionDto";
import { buildFilterTree } from "@/lib/questionBankFilterTree";
import { buildWhere, buildOrderBy, toQueryString } from "@/lib/questionBankQuery";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";

export const revalidate = 3600;

const PAGE_SIZE = 15;

type ExtraParams = {
  chapterId?: string;
  topicId?: string;
  sloId?: string;
  difficulty?: string;
  pastPaper?: string;
  questionType?: string;
  sort?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classLevel: string; subject: string }>;
}): Promise<Metadata> {
  const { classLevel, subject: subjectSlug } = await params;
  const resolved = await resolveClassSubject(classLevel, subjectSlug);
  if (!resolved) return {};
  const classLabel = classLevelToLabel(resolved.cls.level);
  return {
    title: `AKUEB ${classLabel} ${resolved.subject.name} Past Papers & Practice Questions`,
    description: `Practice AKUEB ${classLabel} ${resolved.subject.name} chapter-wise MCQs and past papers online, with instant grading.`,
  };
}

export default async function SubjectQuestionBankPage({
  params,
  searchParams,
}: {
  params: Promise<{ classLevel: string; subject: string }>;
  searchParams: Promise<ExtraParams>;
}) {
  const { classLevel, subject: subjectSlug } = await params;
  const extra = await searchParams;
  const resolved = await resolveClassSubject(classLevel, subjectSlug);
  if (!resolved) notFound();
  const { cls, subject } = resolved;
  const classLabel = classLevelToLabel(cls.level);

  const fixed = { classId: cls.id, subjectId: subject.id };
  const where = buildWhere({ ...fixed, ...extra });
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
      title={`${classLabel} ${subject.name} Question Bank`}
      description={`Practice ${subject.name} chapter-wise, or work through past papers - every question is gradeable instantly.`}
      backHref={`/question-bank/${classLevel}`}
      backLabel={`${classLabel} Question Bank`}
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
          description: `Free AKUEB ${classLabel} ${subject.name} question bank, chapter-wise practice, and past papers.`,
        },
        breadcrumbJsonLd([
          { name: "Question Bank", url: "/question-bank" },
          { name: classLabel, url: `/question-bank/${classLevel}` },
          { name: subject.name, url: `/question-bank/${classLevel}/${subjectSlug}` },
        ]),
      ]}
    />
  );
}
