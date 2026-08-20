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

// Pulls the {num} and {den} out of a \frac at `openIdx` (which must point at
// the "{" opening the first group), respecting nested braces so something
// like \frac{-\frac{1}{2}}{3} extracts correctly. Returns null on unbalanced
// braces.
function extractBraced(s: string, openIdx: number): [string | null, number] {
  if (s[openIdx] !== "{") return [null, openIdx];
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return [s.slice(openIdx + 1, i), i + 1];
    }
  }
  return [null, openIdx];
}

// TeX only requires braces around a \frac argument when it's more than one
// token - MathLive relies on this and serializes a single-digit fraction as
// e.g. "\frac72" (meaning \frac{7}{2}) rather than "\frac{7}{2}", so a brace
// group is just one *kind* of argument, not the only one.
function extractArg(s: string, i: number): [string | null, number] {
  if (i >= s.length) return [null, i];
  if (s[i] === "{") return extractBraced(s, i);
  return [s[i], i + 1];
}

// Rewrites every \frac<a><b> (recursively, so nested fractions work) into
// (a)/(b) so the result can be evaluated as plain arithmetic - each of <a>/<b>
// is either a {braced group} or a single character, per TeX's argument rules
// (see extractArg). Returns null if a \frac isn't followed by two arguments.
function convertFracToDivision(s: string): string | null {
  const FRAC = "\\frac";
  while (s.includes(FRAC)) {
    const idx = s.indexOf(FRAC);
    const [num, afterNum] = extractArg(s, idx + FRAC.length);
    if (num === null) return null;
    const [den, afterDen] = extractArg(s, afterNum);
    if (den === null) return null;
    const numConverted = convertFracToDivision(num);
    const denConverted = convertFracToDivision(den);
    if (numConverted === null || denConverted === null) return null;
    s = `${s.slice(0, idx)}(${numConverted})/(${denConverted})${s.slice(afterDen)}`;
  }
  return s;
}

// Strips the LaTeX wrapping (\left/\right, $ delimiters, a typographic minus)
// and rewrites \frac/\cdot/\times/\div into JS-arithmetic spelling. Shared by
// the pure-arithmetic and algebraic evaluators below. Returns null if a
// \frac isn't well-formed (see convertFracToDivision).
function cleanLatexForEval(latex: string): string | null {
  const s = latex
    .trim()
    .replace(/^\$+|\$+$/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\dfrac|\\tfrac/g, "\\frac")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/\\div/g, "/")
    // MathLive can render/serialize a typographic minus (U+2212) instead of
    // an ASCII hyphen depending on how it was typed - visually identical,
    // but a different character, so normalize before evaluating.
    .replace(/−/g, "-");
  const converted = convertFracToDivision(s);
  if (converted === null) return null;
  return converted.replace(/\s+/g, "");
}

function safeEvalArithmetic(cleaned: string): number | null {
  if (!cleaned || !/^[\d+\-*/().]+$/.test(cleaned)) return null;
  try {
    // Safe despite the dynamic construction: `cleaned` is whitelisted above
    // to digits/+-*/()., so no identifiers or statement separators can
    // reach the Function body.
    const val = Function(`"use strict";return (${cleaned});`)() as unknown;
    return typeof val === "number" && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

// A math-keyboard answer like "-7/2" has more than one valid LaTeX spelling
// (e.g. "-\frac{7}{2}" vs "\frac{-7}{2}") depending on exactly how the minus
// sign was typed relative to the fraction button - both render identically
// but aren't the same string. Evaluating both sides as arithmetic lets
// numerically-equal answers match regardless of which spelling was used.
// Returns null for anything that isn't pure arithmetic (variables, other
// LaTeX commands), so non-numeric answers fall through to the algebraic or
// exact-string checks.
function evalLatexArithmetic(latex: string): number | null {
  const cleaned = cleanLatexForEval(latex);
  return cleaned === null ? null : safeEvalArithmetic(cleaned);
}

// Same letter-adjacency rules as standard math notation: a digit/letter/")"
// immediately followed by a letter/"(" implies multiplication (e.g. "5n",
// "n(5n+9)", ")(" ), except between two digits where it's just one number
// (e.g. "59"). Lets algebraic LaTeX be evaluated as JS once variables are
// substituted with numbers.
function insertImplicitMultiplication(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    out += s[i];
    if (i + 1 >= s.length) continue;
    const a = s[i];
    const b = s[i + 1];
    const aEndsFactor = /[a-zA-Z0-9)]/.test(a);
    const bStartsFactor = /[a-zA-Z(]/.test(b) || /[0-9]/.test(b);
    const bothDigits = /[0-9]/.test(a) && /[0-9]/.test(b);
    if (aEndsFactor && bStartsFactor && !bothDigits) out += "*";
  }
  return out;
}

// Distinct single letters appearing in the normalized (LaTeX-command-free)
// expression, e.g. "n(5n+9)/2" -> ["n"]. Returns null if the expression
// couldn't be normalized (unbalanced \frac).
function extractVariables(latex: string): string[] | null {
  const cleaned = cleanLatexForEval(latex);
  if (cleaned === null) return null;
  return Array.from(new Set(cleaned.match(/[a-zA-Z]/g) ?? []));
}

function evalLatexAlgebraic(latex: string, substitutions: Record<string, number>): number | null {
  const cleaned = cleanLatexForEval(latex);
  if (cleaned === null) return null;
  let substituted = insertImplicitMultiplication(cleaned);
  for (const [name, val] of Object.entries(substitutions)) {
    substituted = substituted.split(name).join(`(${val})`);
  }
  return safeEvalArithmetic(substituted);
}

// A math-keyboard answer containing a variable (e.g. "n(5n+9)/2") also has
// more than one valid LaTeX spelling (\frac{n(5n+9)}{2}, extra \left(\right)
// grouping, etc.) that the exact-string check would reject. Since there's no
// CAS available, equivalence is approximated by substituting several random
// numeric values for each variable and checking the two sides agree at all
// of them - a coincidental match across multiple random points is
// vanishingly unlikely unless the expressions really are equivalent.
// Returns null (defer to the caller's other checks) when neither side has a
// variable, when the variable sets differ, or when either side can't be
// evaluated as algebra.
function algebraicMatch(value: string, answer: string): boolean | null {
  const varsValue = extractVariables(value);
  const varsAnswer = extractVariables(answer);
  if (varsValue === null || varsAnswer === null) return null;
  if (varsValue.length === 0 && varsAnswer.length === 0) return null;
  const sortedValue = [...varsValue].sort().join(",");
  const sortedAnswer = [...varsAnswer].sort().join(",");
  if (sortedValue !== sortedAnswer) return false;

  const TRIALS = 5;
  for (let t = 0; t < TRIALS; t++) {
    const substitutions: Record<string, number> = {};
    for (const v of varsAnswer) {
      substitutions[v] = Math.random() * 8 + 1.31 + t * 0.73;
    }
    const numValue = evalLatexAlgebraic(value, substitutions);
    const numAnswer = evalLatexAlgebraic(answer, substitutions);
    if (numValue === null || numAnswer === null) return null;
    if (Math.abs(numValue - numAnswer) > 1e-6) return false;
  }
  return true;
}

function matches(value: string, answer: string): boolean {
  const trimmedValue = value.trim().toLowerCase();
  const trimmedAnswer = answer.trim().toLowerCase();
  if (trimmedValue === trimmedAnswer) return true;

  const algebraic = algebraicMatch(value, answer);
  if (algebraic !== null) return algebraic;

  const numValue = evalLatexArithmetic(value);
  const numAnswer = evalLatexArithmetic(answer);
  if (numValue === null || numAnswer === null) return false;
  return Math.abs(numValue - numAnswer) < 1e-9;
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
                  <span className="text-base text-green-700 dark:text-green-500 ml-1 align-middle">
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
