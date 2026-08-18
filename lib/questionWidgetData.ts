import type { QuestionType } from "@/app/generated/prisma/enums";

// Question.data stores one question per row (e.g. MCQ: { choices, correctIndex }
// directly, no wrapper), whereas QuestionWidget was built for ContentBlock's
// QUESTION content shape, which supports multiple sub-questions per block
// (e.g. MCQ: { mcqQuestions: [{ text, choices, correctIndex }] }). Every type
// except MCQ already matches QuestionWidget's expected shape as-is (NUMERIC/
// SHORT_TEXT are single-value, TRUE_FALSE/FILL_IN_BLANK are already
// multi-part arrays) - only MCQ needs wrapping into a single-item list, with
// an empty sub-question text since the Question's own prompt is shown above it.
export function toWidgetData(type: QuestionType, data: Record<string, unknown>): Record<string, unknown> {
  if (type === "MCQ") {
    return {
      mcqQuestions: [{ text: "", choices: (data.choices as string[]) ?? [], correctIndex: (data.correctIndex as number) ?? 0 }],
    };
  }
  return data;
}
