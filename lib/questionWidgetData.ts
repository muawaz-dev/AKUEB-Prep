import type { QuestionType } from "@/app/generated/prisma/enums";

// Question.data stores one question per row (e.g. MCQ: { choices, correctIndex }
// directly, no wrapper), whereas QuestionWidget was built for ContentBlock's
// QUESTION content shape, which supports multiple sub-questions per block
// (e.g. MCQ: { mcqQuestions: [{ text, choices, correctIndex }] }). Every type
// except MCQ already matches QuestionWidget's expected shape as-is (NUMERIC/
// SHORT_TEXT are single-value, TRUE_FALSE/FILL_IN_BLANK are already
// multi-part arrays) - only MCQ needs wrapping into a single-item list, with
// an empty sub-question text since the Question's own prompt is shown above it.
//
// This also strips the answer key (correctIndex/answer/tolerance/
// acceptedAnswers/isTrue/blank.answer) out of what's returned - this is the
// shape that gets serialized into the page/API response and sent to every
// visitor's browser before they've attempted the question, so the real
// answer only exists server-side until lib/answerChecking.ts's checkAnswer
// grades an actual submission (see app/question-bank/actions.ts).
export function toWidgetData(type: QuestionType, data: Record<string, unknown>): Record<string, unknown> {
  if (type === "MCQ") {
    return { mcqQuestions: [{ text: "", choices: (data.choices as string[]) ?? [] }] };
  }
  if (type === "TRUE_FALSE") {
    const statements = (data.statements as { text: string }[]) ?? [];
    return { statements: statements.map((s) => ({ text: s.text })) };
  }
  if (type === "FILL_IN_BLANK") {
    const blanks = (data.blanks as { options?: string[] }[]) ?? [];
    return { segments: data.segments, blanks: blanks.map((b) => ({ options: b.options })) };
  }
  // NUMERIC/SHORT_TEXT carry no client-safe substructure at all pre-check -
  // the whole point is the answer, so nothing of `data` is sent.
  return {};
}
