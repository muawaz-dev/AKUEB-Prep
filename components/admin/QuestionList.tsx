"use client";

import type { ContentStatus, Difficulty, QuestionType } from "@/app/generated/prisma/enums";
import type { FilterClass } from "@/lib/questionBankFilterTree";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { QuestionForm } from "@/components/admin/QuestionForm";

type Question = {
  id: string;
  updatedAt: Date;
  classId: string;
  subjectId: string;
  chapterId: string | null;
  topicId: string | null;
  sloId: string | null;
  class: { level: number };
  subject: { name: string };
  chapter: { title: string; orderIndex: number } | null;
  topic: { code: string; title: string } | null;
  slo: { code: string } | null;
  type: QuestionType;
  prompt: string;
  difficulty: Difficulty;
  pastPaper: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  status: ContentStatus;
  explanation: string | null;
  data: Record<string, unknown>;
};

export function QuestionList({
  classes,
  questions,
  updateAction,
  deleteAction,
  emptyMessage,
}: {
  classes: FilterClass[];
  questions: Question[];
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
  emptyMessage: string;
}) {
  if (questions.length === 0) {
    return <p className="text-sm text-black/50 dark:text-white/50">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {questions.map((q) => (
        <details key={q.id} className="border border-black/10 dark:border-white/10 rounded p-4">
          <summary className="flex items-center gap-3 cursor-pointer text-sm">
            <span className="font-medium shrink-0">{q.type}</span>
            <span className="text-xs shrink-0 rounded px-1.5 py-0.5 border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60">
              {q.difficulty}
            </span>
            <span
              className={`text-xs shrink-0 rounded px-1.5 py-0.5 border ${
                q.status === "PUBLISHED"
                  ? "border-green-600 text-green-700 dark:text-green-500"
                  : "border-black/20 dark:border-white/20 text-black/50 dark:text-white/50"
              }`}
            >
              {q.status}
            </span>
            <span className="text-xs shrink-0 text-black/40 dark:text-white/40">
              Class {q.class.level} - {q.subject.name}
              {q.chapter ? ` / ${q.chapter.title}` : ""}
              {q.topic ? ` / ${q.topic.code}` : ""}
              {q.slo ? ` / ${q.slo.code}` : ""}
            </span>
            <span className="text-black/50 dark:text-white/50 truncate">{q.prompt.slice(0, 60)}</span>
          </summary>
          <div className="mt-4">
            {/* React 19 resets a form's uncontrolled fields to their original
                defaultValue after a successful action submission - without a
                key tied to updatedAt, the fields would snap back to the values
                from before this save instead of showing what was just saved. */}
            <QuestionForm
              key={`${q.id}-${q.updatedAt.getTime()}`}
              classes={classes}
              action={updateAction}
              initial={{
                id: q.id,
                classId: q.classId,
                subjectId: q.subjectId,
                chapterId: q.chapterId,
                topicId: q.topicId,
                sloId: q.sloId,
                type: q.type,
                prompt: q.prompt,
                difficulty: q.difficulty,
                pastPaper: q.pastPaper,
                imageUrl: q.imageUrl,
                imageAlt: q.imageAlt,
                status: q.status,
                explanation: q.explanation,
                data: q.data,
              }}
            />
            <form action={deleteAction} className="mt-3">
              <input type="hidden" name="id" value={q.id} />
              <ConfirmSubmitButton confirmMessage="Delete this question?" className="text-sm text-red-600 hover:underline">
                Delete question
              </ConfirmSubmitButton>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}
