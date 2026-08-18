import { prisma } from "@/lib/prisma";
import { QuestionAdminSelector } from "@/components/admin/QuestionAdminSelector";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { QuestionList } from "@/components/admin/QuestionList";
import { buildCurriculumTree } from "@/lib/questionBankFilterTree";
import { createQuestion, updateQuestion, deleteQuestion } from "./actions";
import type { Prisma } from "@/app/generated/prisma/client";

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; subjectId?: string; chapterId?: string; topicId?: string; sloId?: string }>;
}) {
  const params = await searchParams;

  // Every status (including drafts), sourced from the real curriculum tables
  // directly - this is the authoring view, so it must show everything
  // available for tagging, not just what's already used on a question.
  const chapters = await prisma.chapter.findMany({
    select: {
      id: true,
      title: true,
      orderIndex: true,
      class: { select: { id: true, level: true } },
      subject: { select: { id: true, name: true } },
      topics: {
        select: {
          id: true,
          code: true,
          title: true,
          orderIndex: true,
          slos: { select: { id: true, code: true, orderIndex: true } },
        },
      },
    },
  });
  const classes = buildCurriculumTree(chapters);

  const where: Prisma.QuestionWhereInput = {};
  if (params.classId) where.classId = params.classId;
  if (params.subjectId) where.subjectId = params.subjectId;
  if (params.chapterId) where.chapterId = params.chapterId;
  if (params.topicId) where.topicId = params.topicId;
  if (params.sloId) where.sloId = params.sloId;

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      class: true,
      subject: true,
      chapter: true,
      topic: true,
      slo: true,
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Question bank</h1>
        <p className="text-sm text-black/50 dark:text-white/50 mt-1">
          Filter existing questions by class/subject/chapter/topic/SLO, or add a new one below - questions aren&apos;t
          tied to a Course, so a brand new class or subject can be typed directly into the form with nothing selected
          here.
        </p>
      </div>

      <QuestionAdminSelector classes={classes} />

      <div>
        <h2 className="text-sm font-semibold mb-2 text-black/60 dark:text-white/60">
          Questions ({questions.length})
        </h2>
        <QuestionList
          classes={classes}
          questions={questions.map((q) => ({ ...q, data: q.data as Record<string, unknown> }))}
          updateAction={updateQuestion}
          deleteAction={deleteQuestion}
          emptyMessage="No questions match this selection yet."
        />
      </div>

      <details className="border border-black/10 dark:border-white/10 rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">Add a question</summary>
        <div className="mt-4">
          <QuestionForm
            classes={classes}
            action={createQuestion}
            defaultLocation={{
              classId: params.classId,
              subjectId: params.subjectId,
              chapterId: params.chapterId,
              topicId: params.topicId,
              sloId: params.sloId,
            }}
          />
        </div>
      </details>
    </div>
  );
}
