import type { QuestionType, Difficulty } from "@/app/generated/prisma/enums";
import { toWidgetData } from "./questionWidgetData";

// The shape every question-bank list (server-rendered first page, and the
// /api/questions "load more" page) sends down to QuestionList - already
// widget-ready and with its breadcrumb precomputed, so the client never
// needs to know about Class/Subject/Chapter/Topic/Slo relations directly.
export type QuestionDTO = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  pastPaper: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  prompt: string;
  data: Record<string, unknown>;
  explanation: string | null;
  breadcrumb: string;
};

type RawQuestion = {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  pastPaper: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  prompt: string;
  data: unknown;
  explanation: string | null;
  class: { level: number };
  subject: { name: string };
  chapter: { orderIndex: number; title: string } | null;
  topic: { code: string; title: string } | null;
  slo: { code: string } | null;
};

export function toQuestionDto(q: RawQuestion): QuestionDTO {
  const breadcrumbParts = [
    `Class ${q.class.level} - ${q.subject.name}`,
    q.chapter ? `Unit ${q.chapter.orderIndex} - ${q.chapter.title}` : undefined,
    q.topic ? `${q.topic.code} ${q.topic.title}` : undefined,
    q.slo?.code,
  ].filter(Boolean);

  return {
    id: q.id,
    type: q.type,
    difficulty: q.difficulty,
    pastPaper: q.pastPaper,
    imageUrl: q.imageUrl,
    imageAlt: q.imageAlt,
    prompt: q.prompt,
    data: toWidgetData(q.type, q.data as Record<string, unknown>),
    // Withheld until a real check happens (see checkQuestionAnswer in
    // app/question-bank/actions.ts) - explanation text almost always states
    // the correct answer directly, so shipping it upfront would defeat the
    // point of stripping the answer key out of `data` above.
    explanation: null,
    breadcrumb: breadcrumbParts.join(" / "),
  };
}
