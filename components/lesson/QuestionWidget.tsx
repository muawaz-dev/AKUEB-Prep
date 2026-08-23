"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import type { QuestionType } from "@/app/generated/prisma/enums";
import { MarkdownContent } from "./MarkdownContent";
import { MathKeyboardInput } from "../MathKeyboardInput";
import { checkQuestionAnswer } from "@/app/question-bank/actions";
import { matches, type Submission, type CheckResult } from "@/lib/answerChecking";

// correctIndex/isTrue/answer are absent for tracked questions (questionId
// set) - the server strips them before this data ever reaches the browser
// (see lib/questionWidgetData.ts) and reveals them via checkQuestionAnswer
// instead. Untracked (ContentBlock) questions always carry them for real.
type McqQuestion = { text: string; choices: string[]; correctIndex?: number; explanation?: string };
type TrueFalseStatement = { text: string; isTrue?: boolean; explanation?: string };
type BlankConfig = { options?: string[]; answer?: string };

type QuestionData = {
  mcqQuestions?: McqQuestion[];
  answer?: number;
  tolerance?: number;
  acceptedAnswers?: string[];
  statements?: TrueFalseStatement[];
  segments?: string[];
  blanks?: BlankConfig[];
};

export function QuestionWidget({
  type,
  title,
  imageUrl,
  imageAlt,
  prompt,
  data,
  explanation,
  questionId,
}: {
  type: QuestionType;
  title?: string;
  imageUrl?: string;
  imageAlt?: string;
  prompt: string;
  data: QuestionData;
  explanation: string | null;
  // When set, a correct check is reported to the question bank (solved
  // tracking + points) - omit for previews/contexts with no backing Question row.
  questionId?: string;
}) {
  const [mcqSelections, setMcqSelections] = useState<(number | null)[]>(
    () => (data.mcqQuestions ?? []).map(() => null)
  );
  const [numericInput, setNumericInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [tfSelections, setTfSelections] = useState<(boolean | null)[]>(
    () => (data.statements ?? []).map(() => null)
  );
  const [blankInputs, setBlankInputs] = useState<string[]>(() => (data.blanks ?? []).map(() => ""));
  // Locks the answer inputs and the check button for good the moment an
  // attempt is checked - a student gets exactly one shot per question, and
  // only remounting the widget (new question, filter change, page refresh)
  // clears this.
  const [checked, setChecked] = useState(false);
  // Purely a display toggle for the written explanation text - correct/
  // incorrect highlighting already shows as soon as `checked` is true, so
  // there's nothing left to gate by hiding this again.
  const [explanationRevealed, setExplanationRevealed] = useState(false);
  const [openBlank, setOpenBlank] = useState<number | null>(null);
  const blankMenuRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const openBlankMenuRef = useRef<HTMLDivElement | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);
  // For tracked questions (questionId set), `data` has the answer key
  // stripped server-side (see lib/questionWidgetData.ts) - these hold what
  // checkQuestionAnswer reveals once a real check comes back, standing in
  // for the answer-key fields untracked questions already carry in `data`.
  const [serverResult, setServerResult] = useState<CheckResult | null>(null);
  const [serverExplanation, setServerExplanation] = useState<string | null>(null);
  const [checkPending, startCheckTransition] = useTransition();

  function resetAttempt() {
    setChecked(false);
    setExplanationRevealed(false);
    setPointsAwarded(null);
    setServerResult(null);
    setServerExplanation(null);
  }

  useEffect(() => {
    if (checked) setOpenBlank(null);
  }, [checked]);

  useEffect(() => {
    if (openBlank === null) return;
    function handleClickOutside(e: MouseEvent) {
      if (!blankMenuRefs.current[openBlank as number]?.contains(e.target as Node)) {
        setOpenBlank(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openBlank]);

  // The options dropdown is absolutely positioned off a small inline anchor
  // that can sit anywhere along a wrapped line of text - left-aligning it
  // unconditionally lets it run past the right edge of the viewport on
  // narrow screens. Reassigning `left` (rather than a visual `transform`)
  // after it renders keeps the box's actual layout position - and therefore
  // the page's scrollable width - inside the viewport too, not just its
  // painted position.
  useLayoutEffect(() => {
    if (openBlank === null) return;
    const el = openBlankMenuRef.current;
    const anchor = blankMenuRefs.current[openBlank];
    if (!el || !anchor) return;
    el.style.left = "0px";
    const margin = 8;
    const anchorLeft = anchor.getBoundingClientRect().left;
    const menuWidth = el.getBoundingClientRect().width;
    let left = 0;
    if (anchorLeft + left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - menuWidth - anchorLeft;
    }
    if (anchorLeft + left < margin) {
      left = margin - anchorLeft;
    }
    el.style.left = `${left}px`;
  }, [openBlank]);

  const mcqQuestions = data.mcqQuestions ?? [];
  const statements = data.statements ?? [];
  const segments = data.segments ?? [];
  const blanks = data.blanks ?? [];

  // Tracked questions (questionId set) never carry the answer key in `data`
  // (it's stripped server-side, see lib/questionWidgetData.ts) - these read
  // it from what checkQuestionAnswer revealed instead, once a real check has
  // come back. Untracked questions already have the full answer key in
  // `data`, so they're used as-is. Either way, undefined means "not known
  // yet" (tracked + not checked).
  const mcqCorrectIndex = (qi: number): number | undefined =>
    questionId ? (serverResult?.type === "MCQ" ? serverResult.correctIndex : undefined) : mcqQuestions[qi]?.correctIndex;
  const statementIsTrue = (i: number): boolean | undefined =>
    questionId ? (serverResult?.type === "TRUE_FALSE" ? serverResult.statements[i]?.isTrue : undefined) : statements[i]?.isTrue;
  const statementExplanation = (i: number): string | undefined =>
    questionId
      ? serverResult?.type === "TRUE_FALSE"
        ? serverResult.statements[i]?.explanation
        : undefined
      : statements[i]?.explanation;
  const blankAnswer = (i: number): string | undefined =>
    questionId ? (serverResult?.type === "FILL_IN_BLANK" ? serverResult.blanks[i]?.answer : undefined) : blanks[i]?.answer;

  // Only ever called for untracked (ContentBlock) questions, where `data`
  // genuinely carries the full answer key - hence the assertion below.
  // Tracked questions compute `correct` from serverResult instead (see below).
  const isCorrect = (): boolean => {
    if (type === "MCQ") return mcqQuestions.every((q, i) => mcqSelections[i] === q.correctIndex);
    if (type === "NUMERIC") {
      const value = Number(numericInput);
      if (!Number.isFinite(value)) return false;
      const tolerance = data.tolerance ?? 0;
      return Math.abs(value - (data.answer ?? NaN)) <= tolerance;
    }
    if (type === "SHORT_TEXT") {
      const normalized = textInput.trim().toLowerCase();
      return (data.acceptedAnswers ?? []).some((a) => a.trim().toLowerCase() === normalized);
    }
    if (type === "TRUE_FALSE") {
      return statements.every((s, i) => tfSelections[i] === s.isTrue);
    }
    if (type === "FILL_IN_BLANK") {
      return blanks.every((b, i) => matches(blankInputs[i] ?? "", b.answer!));
    }
    return false;
  };

  function buildSubmission(): Submission {
    if (type === "MCQ") return { type: "MCQ", selectedIndex: mcqSelections[0] ?? null };
    if (type === "NUMERIC") return { type: "NUMERIC", value: numericInput };
    if (type === "SHORT_TEXT") return { type: "SHORT_TEXT", value: textInput };
    if (type === "TRUE_FALSE") return { type: "TRUE_FALSE", selections: tfSelections };
    return { type: "FILL_IN_BLANK", values: blankInputs };
  }

  const canCheck =
    (type === "MCQ" && mcqQuestions.length > 0 && mcqSelections.every((s) => s !== null)) ||
    (type === "NUMERIC" && numericInput.trim() !== "") ||
    (type === "SHORT_TEXT" && textInput.trim() !== "") ||
    (type === "TRUE_FALSE" && statements.length > 0 && tfSelections.every((s) => s !== null)) ||
    (type === "FILL_IN_BLANK" && blanks.length > 0 && blankInputs.every((v) => v.trim() !== ""));

  // Tracked questions only know correctness once the server's graded the
  // submission (see handleCheck); untracked ones can grade instantly from
  // the answer key already present in `data`.
  const correct = checked && (questionId ? (serverResult?.correct ?? false) : isCorrect());
  // Tracked questions' `explanation` prop is always null (stripped
  // server-side, same reasoning as the answer key); the real text only
  // arrives via checkQuestionAnswer once a check comes back.
  const effectiveExplanation = questionId ? serverExplanation : explanation;
  // Correct-answer highlighting shows the moment the attempt is checked -
  // only the written explanation text waits for the reveal button.
  const revealAnswers = checked;
  const explanationVisible = checked && explanationRevealed;
  const mcqCorrectCount = mcqQuestions.filter((_, i) => mcqSelections[i] === mcqCorrectIndex(i)).length;
  const tfCorrectCount = statements.filter((_, i) => tfSelections[i] === statementIsTrue(i)).length;
  const blankCorrectCount = blanks.filter((_, i) => {
    const answer = blankAnswer(i);
    return answer !== undefined && matches(blankInputs[i] ?? "", answer);
  }).length;
  const partsTotal =
    type === "MCQ" ? mcqQuestions.length : type === "TRUE_FALSE" ? statements.length : type === "FILL_IN_BLANK" ? blanks.length : 0;
  const partsCorrectCount =
    type === "MCQ" ? mcqCorrectCount : type === "TRUE_FALSE" ? tfCorrectCount : type === "FILL_IN_BLANK" ? blankCorrectCount : 0;

  return (
    <div className="rounded p-4 flex flex-col gap-3 bg-black/[0.04] dark:bg-white/[0.06]">
      {title && (
        <p className="text-center text-heading font-bold">
          <MarkdownContent text={title} inline />
        </p>
      )}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL, not a local optimized asset
        <img src={imageUrl} alt={imageAlt ?? ""} className="rounded max-w-full mx-auto" />
      )}
      <p className="text-lg font-bold">
        <MarkdownContent text={prompt} inline />
      </p>

      {type === "MCQ" && (
        <div className="flex flex-col gap-4">
          {mcqQuestions.map((q, qi) => {
            const selected = mcqSelections[qi];
            const correctIndex = mcqCorrectIndex(qi);
            const gotRight = checked && selected === correctIndex;
            return (
              <div key={qi} className="flex flex-col gap-1.5">
                {q.text && (
                  <p className="text-base font-medium">
                    <MarkdownContent text={q.text} inline />
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {q.choices.map((choice, ci) => {
                    const isSelected = selected === ci;
                    const showAsCorrectAnswer = revealAnswers && !gotRight && correctIndex === ci;
                    return (
                      <label
                        key={ci}
                        className={`flex items-center gap-2 text-base ${
                          checked && isSelected
                            ? gotRight
                              ? "text-green-700 dark:text-green-500"
                              : "text-red-700 dark:text-red-500"
                            : showAsCorrectAnswer
                              ? "text-green-700 dark:text-green-500"
                              : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`mcq-${qi}-${prompt}`}
                          checked={isSelected}
                          disabled={checked}
                          onChange={() => {
                            setMcqSelections((prev) => prev.map((v, idx) => (idx === qi ? ci : v)));
                            resetAttempt();
                          }}
                        />
                        <MarkdownContent text={choice} inline />
                      </label>
                    );
                  })}
                </div>
                {explanationVisible && q.explanation && (
                  <p className={`text-xs ${gotRight ? "text-green-600" : "text-red-600"}`}>
                    <MarkdownContent text={q.explanation} inline />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {type === "NUMERIC" && (
        <input
          type="number"
          value={numericInput}
          disabled={checked}
          onChange={(e) => {
            setNumericInput(e.target.value);
            resetAttempt();
          }}
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent w-40 disabled:opacity-60"
        />
      )}

      {type === "SHORT_TEXT" && (
        <MathKeyboardInput
          value={textInput}
          disabled={checked}
          onChange={(v) => {
            setTextInput(v);
            resetAttempt();
          }}
          className="max-w-sm"
        />
      )}

      {type === "TRUE_FALSE" && (
        <div className="flex flex-col gap-3">
          {statements.map((statement, i) => {
            const selection = tfSelections[i];
            const isTrue = statementIsTrue(i);
            const gotRight = checked && selection === isTrue;
            const gotWrong = checked && selection !== null && selection !== isTrue;
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base flex-1">
                    <MarkdownContent text={statement.text} inline />
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    {([true, false] as const).map((option) => {
                      const isSelected = selection === option;
                      const showAsCorrectAnswer = revealAnswers && gotWrong && isTrue === option;
                      return (
                        <button
                          key={String(option)}
                          type="button"
                          disabled={checked}
                          onClick={() => {
                            setTfSelections((prev) => prev.map((v, idx) => (idx === i ? option : v)));
                            resetAttempt();
                          }}
                          className={`text-xs font-medium rounded px-2.5 py-1 border disabled:opacity-60 ${
                            isSelected && checked
                              ? gotRight
                                ? "border-green-600 bg-green-600/10 text-green-700 dark:text-green-500"
                                : "border-red-600 bg-red-600/10 text-red-700 dark:text-red-500"
                              : isSelected
                                ? "border-black dark:border-white"
                                : showAsCorrectAnswer
                                  ? "border-green-600 text-green-700 dark:text-green-500"
                                  : "border-black/20 dark:border-white/20 text-black/60 dark:text-white/60"
                          }`}
                        >
                          {option ? "True" : "False"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {explanationVisible && statementExplanation(i) && (
                  <p className={`text-xs ${gotRight ? "text-green-600" : "text-red-600"}`}>
                    <MarkdownContent text={statementExplanation(i)!} inline />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {type === "FILL_IN_BLANK" && (
        <div className="text-base leading-8">
          {blanks.map((blank, i) => {
            const value = blankInputs[i] ?? "";
            const answer = blankAnswer(i);
            const gotRight = checked && answer !== undefined && matches(value, answer);
            const gotWrong = checked && value.trim() !== "" && !(answer !== undefined && matches(value, answer));
            const stateClass = gotRight
              ? "border-green-600 bg-green-600/10 text-green-700 dark:text-green-500"
              : gotWrong
                ? "border-red-600 bg-red-600/10 text-red-700 dark:text-red-500"
                : "border-black/20 dark:border-white/20";
            return (
              <span key={i}>
                {segments[i] && <MarkdownContent text={segments[i]} inline />}
                {blank.options?.length ? (
                  <span
                    ref={(el) => {
                      blankMenuRefs.current[i] = el;
                    }}
                    className="relative inline-block mx-1 align-middle"
                  >
                    <button
                      type="button"
                      disabled={checked}
                      onClick={() => setOpenBlank((prev) => (prev === i ? null : i))}
                      className={`border rounded px-2 py-1 bg-transparent text-sm disabled:opacity-60 ${stateClass}`}
                    >
                      {value ? <MarkdownContent text={value} inline /> : <span className="opacity-50">Choose...</span>}
                    </button>
                    {openBlank === i && (
                      <div
                        ref={openBlankMenuRef}
                        className="absolute left-0 top-full mt-1 z-10 w-max max-w-[calc(100vw-1rem)] border border-black/20 dark:border-white/20 rounded bg-white dark:bg-black shadow-lg py-1"
                      >
                        {blank.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setBlankInputs((prev) => prev.map((v, idx) => (idx === i ? option : v)));
                              resetAttempt();
                              setOpenBlank(null);
                            }}
                            className="block w-full text-left px-3 py-1 text-sm whitespace-normal break-words hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            <MarkdownContent text={option} inline />
                          </button>
                        ))}
                      </div>
                    )}
                  </span>
                ) : (
                  <MathKeyboardInput
                    value={value}
                    disabled={checked}
                    onChange={(v) => {
                      setBlankInputs((prev) => prev.map((vv, idx) => (idx === i ? v : vv)));
                      resetAttempt();
                    }}
                    className="w-42 mx-1 align-middle"
                    inputBoxClassName={stateClass}
                  />
                )}
                {revealAnswers && gotWrong && answer !== undefined && (
                  <span className="text-base text-green-700 dark:text-green-500 ml-1 align-middle whitespace-nowrap">
                    {/* Options-based blanks store fully-delimited Markdown (like MCQ
                        choices do) - only the free-text/MathKeyboardInput path stores
                        raw LaTeX that still needs its own $ wrapper. */}
                    (<MarkdownContent text={blank.options?.length ? answer : `$${answer}$`} inline />)
                  </span>
                )}
              </span>
            );
          })}
          {segments[blanks.length] && <MarkdownContent text={segments[blanks.length]} inline />}
        </div>
      )}

      <button
        type="button"
        disabled={!canCheck || checkPending || checked}
        onClick={() => {
          if (questionId) {
            const submission = buildSubmission();
            startCheckTransition(async () => {
              try {
                const { result, explanation: revealed, attempt } = await checkQuestionAnswer(questionId, type, submission);
                setServerResult(result);
                setServerExplanation(revealed);
                setChecked(true);
                if (attempt) setPointsAwarded(attempt.pointsAwarded);
              } catch {
                // Transient failure (network, etc.) - leave `checked` false
                // so the button stays enabled and the student can retry.
              }
            });
            return;
          }

          setChecked(true);
        }}
        className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-base font-medium w-fit disabled:opacity-40"
      >
        {checkPending ? "Checking..." : "Check answer"}
      </button>

      {checked && partsTotal > 0 && (
        <div className={`text-base ${partsCorrectCount === partsTotal ? "text-green-600" : "text-red-600"}`}>
          {partsCorrectCount} of {partsTotal} correct
        </div>
      )}

      {checked && (
        <div className={`text-base ${correct ? "text-green-600" : "text-red-600"}`}>
          {correct ? "Correct!" : "Not quite."}
          {pointsAwarded !== null && (
            <span className="ml-2 text-sm font-medium text-black/60 dark:text-white/60">{pointsAwarded} points earned</span>
          )}
          <button
            type="button"
            onClick={() => setExplanationRevealed((prev) => !prev)}
            className="block mt-1 text-sm font-medium text-black/60 dark:text-white/60 hover:underline"
          >
            {explanationRevealed ? "Hide explanation" : "Show explanation"}
          </button>
          {effectiveExplanation && explanationVisible && (
            <div className="mt-1 text-black/70 dark:text-white/70">
              <MarkdownContent text={effectiveExplanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
