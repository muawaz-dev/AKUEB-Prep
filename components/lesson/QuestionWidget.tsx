"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { QuestionType } from "@/app/generated/prisma/enums";
import { MarkdownContent } from "./MarkdownContent";
import { MathKeyboardInput } from "../MathKeyboardInput";
import { recordSolvedQuestion } from "@/app/question-bank/actions";

type McqQuestion = { text: string; choices: string[]; correctIndex: number; explanation?: string };
type TrueFalseStatement = { text: string; isTrue: boolean; explanation?: string };
type BlankConfig = { options?: string[]; answer: string };

type QuestionData = {
  mcqQuestions?: McqQuestion[];
  answer?: number;
  tolerance?: number;
  acceptedAnswers?: string[];
  statements?: TrueFalseStatement[];
  segments?: string[];
  blanks?: BlankConfig[];
};

function matches(value: string, answer: string): boolean {
  return value.trim().toLowerCase() === answer.trim().toLowerCase();
}

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
  const [checked, setChecked] = useState(false);
  // Gates the correct-answer reveal and explanation behind a manual click when
  // the attempt was wrong, so retrying doesn't just mean "look at the answer
  // that was already given away" - resets on every new attempt (see resetAttempt).
  const [explanationRevealed, setExplanationRevealed] = useState(false);
  const [openBlank, setOpenBlank] = useState<number | null>(null);
  const blankMenuRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Whether any check attempt in this component's lifetime came back wrong -
  // used to tell the question bank apart a first-try-correct solve (full
  // points) from a solve after retrying (half points). Does not reset with
  // resetAttempt(): it must survive across edits/retries within the session.
  const [hadWrongAttempt, setHadWrongAttempt] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);
  const [, startSolvedTransition] = useTransition();

  function resetAttempt() {
    setChecked(false);
    setExplanationRevealed(false);
    setPointsAwarded(null);
  }

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

  const mcqQuestions = data.mcqQuestions ?? [];
  const statements = data.statements ?? [];
  const segments = data.segments ?? [];
  const blanks = data.blanks ?? [];

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
      return blanks.every((b, i) => matches(blankInputs[i] ?? "", b.answer));
    }
    return false;
  };

  const canCheck =
    (type === "MCQ" && mcqQuestions.length > 0 && mcqSelections.every((s) => s !== null)) ||
    (type === "NUMERIC" && numericInput.trim() !== "") ||
    (type === "SHORT_TEXT" && textInput.trim() !== "") ||
    (type === "TRUE_FALSE" && statements.length > 0 && tfSelections.every((s) => s !== null)) ||
    (type === "FILL_IN_BLANK" && blanks.length > 0 && blankInputs.every((v) => v.trim() !== ""));

  const correct = checked && isCorrect();
  // Nothing to hide once the attempt is fully correct; when it's wrong, the
  // correct-answer highlighting and explanations wait for the reveal button.
  const revealAnswers = checked && (correct || explanationRevealed);
  const mcqCorrectCount = mcqQuestions.filter((q, i) => mcqSelections[i] === q.correctIndex).length;
  const tfCorrectCount = statements.filter((s, i) => tfSelections[i] === s.isTrue).length;
  const blankCorrectCount = blanks.filter((b, i) => matches(blankInputs[i] ?? "", b.answer)).length;
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
            const gotRight = checked && selected === q.correctIndex;
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
                    const showAsCorrectAnswer = revealAnswers && !gotRight && q.correctIndex === ci;
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
                {revealAnswers && q.explanation && (
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
          onChange={(e) => {
            setNumericInput(e.target.value);
            resetAttempt();
          }}
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent w-40"
        />
      )}

      {type === "SHORT_TEXT" && (
        <MathKeyboardInput
          value={textInput}
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
            const gotRight = checked && selection === statement.isTrue;
            const gotWrong = checked && selection !== null && selection !== statement.isTrue;
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base flex-1">
                    <MarkdownContent text={statement.text} inline />
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    {([true, false] as const).map((option) => {
                      const isSelected = selection === option;
                      const showAsCorrectAnswer = revealAnswers && gotWrong && statement.isTrue === option;
                      return (
                        <button
                          key={String(option)}
                          type="button"
                          onClick={() => {
                            setTfSelections((prev) => prev.map((v, idx) => (idx === i ? option : v)));
                            resetAttempt();
                          }}
                          className={`text-xs font-medium rounded px-2.5 py-1 border ${
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
                {revealAnswers && statement.explanation && (
                  <p className={`text-xs ${gotRight ? "text-green-600" : "text-red-600"}`}>
                    <MarkdownContent text={statement.explanation} inline />
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
            const gotRight = checked && matches(value, blank.answer);
            const gotWrong = checked && value.trim() !== "" && !matches(value, blank.answer);
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
                      onClick={() => setOpenBlank((prev) => (prev === i ? null : i))}
                      className={`border rounded px-2 py-1 bg-transparent text-sm ${stateClass}`}
                    >
                      {value ? <MarkdownContent text={value} inline /> : <span className="opacity-50">Choose...</span>}
                    </button>
                    {openBlank === i && (
                      <div className="absolute left-0 top-full mt-1 z-10 min-w-max border border-black/20 dark:border-white/20 rounded bg-white dark:bg-black shadow-lg py-1">
                        {blank.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setBlankInputs((prev) => prev.map((v, idx) => (idx === i ? option : v)));
                              resetAttempt();
                              setOpenBlank(null);
                            }}
                            className="block w-full text-left px-3 py-1 text-sm whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10"
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
                    onChange={(v) => {
                      setBlankInputs((prev) => prev.map((vv, idx) => (idx === i ? v : vv)));
                      resetAttempt();
                    }}
                    className="w-42 mx-1 align-middle"
                    inputBoxClassName={stateClass}
                  />
                )}
                {revealAnswers && gotWrong && (
                  <span className="text-xs text-green-700 dark:text-green-500 ml-1">
                    (<MarkdownContent text={`$${blank.answer}$`} inline />)
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
        disabled={!canCheck}
        onClick={() => {
          setChecked(true);
          if (isCorrect()) {
            if (questionId) {
              const firstTryCorrect = !hadWrongAttempt;
              startSolvedTransition(async () => {
                const result = await recordSolvedQuestion(questionId, firstTryCorrect);
                if (result.ok && !result.alreadySolved) setPointsAwarded(result.pointsAwarded);
              });
            }
          } else {
            setHadWrongAttempt(true);
          }
        }}
        className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-base font-medium w-fit disabled:opacity-40"
      >
        Check answer
      </button>

      {checked && partsTotal > 0 && (
        <div className={`text-base ${partsCorrectCount === partsTotal ? "text-green-600" : "text-red-600"}`}>
          {partsCorrectCount} of {partsTotal} correct
        </div>
      )}

      {checked && (
        <div className={`text-base ${correct ? "text-green-600" : "text-red-600"}`}>
          {correct ? "Correct!" : "Not quite."}
          {correct && pointsAwarded !== null && (
            <span className="ml-2 text-sm font-medium text-black/60 dark:text-white/60">+{pointsAwarded} points</span>
          )}
          {!correct && !explanationRevealed && (
            <button
              type="button"
              onClick={() => setExplanationRevealed(true)}
              className="block mt-1 text-sm font-medium text-black/60 dark:text-white/60 hover:underline"
            >
              Show explanation
            </button>
          )}
          {explanation && revealAnswers && (
            <div className="mt-1 text-black/70 dark:text-white/70">
              <MarkdownContent text={explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
