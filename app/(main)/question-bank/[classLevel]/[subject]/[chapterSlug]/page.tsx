import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { resolveClassSubject, findBySlug, MIN_QUESTIONS } from "@/lib/slugs";
import { QuestionBankPageBody } from "@/components/question-bank/QuestionBankPageBody";
import { MarkdownContent } from "@/components/lesson/MarkdownContent";
import { toQuestionDto } from "@/lib/questionDto";
import { buildFilterTree } from "@/lib/questionBankFilterTree";
import { buildWhere, buildOrderBy, toQueryString } from "@/lib/questionBankQuery";
import { breadcrumbJsonLd } from "@/lib/breadcrumb";

export const revalidate = 3600;

const PAGE_SIZE = 15;

type ExtraParams = {
  topicId?: string;
  sloId?: string;
  difficulty?: string;
  pastPaper?: string;
  sort?: string;
};

async function resolveChapter(classLevelSlug: string, subjectSlug: string, chapterSlug: string) {
  const resolved = await resolveClassSubject(classLevelSlug, subjectSlug);
  if (!resolved) return null;
  const chapters = await prisma.chapter.findMany({
    where: { classId: resolved.cls.id, subjectId: resolved.subject.id, status: "PUBLISHED" },
  });
  const chapter = findBySlug(chapters, chapterSlug, (c) => c.title);
  if (!chapter) return null;
  return { ...resolved, chapter };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classLevel: string; subject: string; chapterSlug: string }>;
}): Promise<Metadata> {
  const { classLevel, subject, chapterSlug } = await params;
  const resolved = await resolveChapter(classLevel, subject, chapterSlug);
  if (!resolved) return {};
  const classLabel = classLevel.toUpperCase();
  return {
    title: `AKUEB ${classLabel} ${resolved.subject.name} ${resolved.chapter.title} MCQs & Practice Questions`,
    description: `Practice AKUEB ${classLabel} ${resolved.subject.name} - ${resolved.chapter.title} questions online with instant grading and explanations.`,
  };
}

export default async function ChapterQuestionBankPage({
  params,
  searchParams,
}: {
  params: Promise<{ classLevel: string; subject: string; chapterSlug: string }>;
  searchParams: Promise<ExtraParams>;
}) {
  const { classLevel, subject: subjectSlug, chapterSlug } = await params;
  const extra = await searchParams;
  const resolved = await resolveChapter(classLevel, subjectSlug, chapterSlug);
  if (!resolved) notFound();
  const { cls, subject, chapter } = resolved;

  const totalCount = await prisma.question.count({ where: { chapterId: chapter.id, status: "PUBLISHED" } });
  if (totalCount < MIN_QUESTIONS) notFound();

  const classLabel = classLevel.toUpperCase();
  const fixed = { classId: cls.id, subjectId: subject.id, chapterId: chapter.id };
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
      title={
        <>
          <MarkdownContent text={chapter.title} inline /> - {classLabel} {subject.name}
        </>
      }
      description={`${totalCount} practice question${totalCount === 1 ? "" : "s"} for this chapter, gradeable instantly.`}
      backHref={`/question-bank/${classLevel}/${subjectSlug}`}
      backLabel={`${classLabel} ${subject.name}`}
      classes={classes}
      pastPaperRows={pastPaperRows}
      initial={fixed}
      initialQuestions={initialQuestions}
      initialHasMore={initialHasMore}
      queryString={toQueryString({ ...fixed, ...extra })}
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: `AKUEB ${classLabel} ${subject.name} - ${chapter.title}`,
          about: subject.name,
          educationalLevel: classLabel,
          numberOfQuestions: totalCount,
        },
        breadcrumbJsonLd([
          { name: "Question Bank", url: "/question-bank" },
          { name: classLabel, url: `/question-bank/${classLevel}` },
          { name: subject.name, url: `/question-bank/${classLevel}/${subjectSlug}` },
          { name: chapter.title, url: `/question-bank/${classLevel}/${subjectSlug}/${chapterSlug}` },
        ]),
      ]}
    />
  );
}
