import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { resolveClassSubject, slugify, classLevelToShortLabel, stripBoardPrefix } from "@/lib/slugs";
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
  questionType?: string;
  sort?: string;
};

async function resolvePaper(classLevelSlug: string, subjectSlug: string, paperSlug: string) {
  const resolved = await resolveClassSubject(classLevelSlug, subjectSlug);
  if (!resolved) return null;

  const groups = await prisma.question.groupBy({
    by: ["pastPaper"],
    where: { classId: resolved.cls.id, subjectId: resolved.subject.id, status: "PUBLISHED", pastPaper: { not: null } },
    _count: { _all: true },
  });
  const match = groups.find((g) => g.pastPaper && slugify(g.pastPaper) === paperSlug);
  if (!match || !match.pastPaper) return null;
  return { ...resolved, pastPaper: match.pastPaper, count: match._count._all };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ classLevel: string; subject: string; paperSlug: string }>;
}): Promise<Metadata> {
  const { classLevel, subject, paperSlug } = await params;
  const resolved = await resolvePaper(classLevel, subject, paperSlug);
  if (!resolved) return {};
  const shortLabel = classLevelToShortLabel(resolved.cls.level);
  const paperLabel = stripBoardPrefix(resolved.pastPaper);
  return {
    title: `AKUEB ${shortLabel} ${resolved.subject.name} ${paperLabel} - Practice Online`,
    description: `Practice the AKUEB ${shortLabel} ${resolved.subject.name} ${paperLabel} past paper online with instant grading and explanations.`,
  };
}

export default async function PastPaperQuestionBankPage({
  params,
  searchParams,
}: {
  params: Promise<{ classLevel: string; subject: string; paperSlug: string }>;
  searchParams: Promise<ExtraParams>;
}) {
  const { classLevel, subject: subjectSlug, paperSlug } = await params;
  const extra = await searchParams;
  const resolved = await resolvePaper(classLevel, subjectSlug, paperSlug);
  if (!resolved) notFound();
  const { cls, subject, pastPaper, count } = resolved;

  const classLabel = classLevelToShortLabel(cls.level);
  const paperLabel = stripBoardPrefix(pastPaper);
  const fixed = { classId: cls.id, subjectId: subject.id, pastPaper };
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
      title={`${classLabel} ${subject.name} ${paperLabel}`}
      description={`${count} question${count === 1 ? "" : "s"} from this paper, gradeable instantly.`}
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
          name: `AKUEB ${classLabel} ${subject.name} ${paperLabel}`,
          about: subject.name,
          educationalLevel: classLabel,
          numberOfQuestions: count,
        },
        breadcrumbJsonLd([
          { name: "Question Bank", url: "/question-bank" },
          { name: classLabel, url: `/question-bank/${classLevel}` },
          { name: subject.name, url: `/question-bank/${classLevel}/${subjectSlug}` },
          { name: paperLabel, url: `/question-bank/${classLevel}/${subjectSlug}/past-papers/${paperSlug}` },
        ]),
      ]}
    />
  );
}
