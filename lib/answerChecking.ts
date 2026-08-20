import type { QuestionType } from "@/app/generated/prisma/enums";

// Shared, framework-free grading logic for Question-bank entries - imported
// by app/question-bank/actions.ts (server, holds the real answer key) and by
// components/lesson/QuestionWidget.tsx (client, only for the untracked
// ContentBlock-embedded practice questions, whose data already includes the
// answer key since they're never persisted as a scored Question row).
//
// Operates on the *raw* Question.data shape as stored in Postgres (one
// question per row, e.g. MCQ is { choices, correctIndex } directly) - not
// the ContentBlock-flavored, multi-sub-question wrapper shape QuestionWidget
// renders (see lib/questionWidgetData.ts for that normalization).

export type Submission =
  | { type: "MCQ"; selectedIndex: number | null }
  | { type: "NUMERIC"; value: string }
  | { type: "SHORT_TEXT"; value: string }
  | { type: "TRUE_FALSE"; selections: (boolean | null)[] }
  | { type: "FILL_IN_BLANK"; values: string[] };

export type CheckResult =
  | { type: "MCQ"; correct: boolean; correctIndex: number }
  | { type: "NUMERIC"; correct: boolean }
  | { type: "SHORT_TEXT"; correct: boolean }
  | { type: "TRUE_FALSE"; correct: boolean; statements: { isTrue: boolean; explanation?: string }[] }
  | { type: "FILL_IN_BLANK"; correct: boolean; blanks: { answer: string }[] };

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

export function matches(value: string, answer: string): boolean {
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

// Grades a submission against a Question row's real, stored `data` (never
// sent to the client until after this runs) - the single source of truth
// for whether a Question-bank attempt is correct, used both to render
// feedback and to decide whether a solve/points get recorded.
export function checkAnswer(type: QuestionType, data: Record<string, unknown>, submission: Submission): CheckResult {
  if (type === "MCQ" && submission.type === "MCQ") {
    const correctIndex = (data.correctIndex as number) ?? 0;
    return { type: "MCQ", correct: submission.selectedIndex === correctIndex, correctIndex };
  }

  if (type === "NUMERIC" && submission.type === "NUMERIC") {
    const answer = (data.answer as number) ?? NaN;
    const tolerance = (data.tolerance as number) ?? 0;
    const value = Number(submission.value);
    const correct = Number.isFinite(value) && Math.abs(value - answer) <= tolerance;
    return { type: "NUMERIC", correct };
  }

  if (type === "SHORT_TEXT" && submission.type === "SHORT_TEXT") {
    const acceptedAnswers = (data.acceptedAnswers as string[]) ?? [];
    const normalized = submission.value.trim().toLowerCase();
    const correct = acceptedAnswers.some((a) => a.trim().toLowerCase() === normalized);
    return { type: "SHORT_TEXT", correct };
  }

  if (type === "TRUE_FALSE" && submission.type === "TRUE_FALSE") {
    const statements = (data.statements as { text: string; isTrue: boolean; explanation?: string }[]) ?? [];
    const correct = statements.every((s, i) => submission.selections[i] === s.isTrue);
    return {
      type: "TRUE_FALSE",
      correct,
      statements: statements.map((s) => ({ isTrue: s.isTrue, explanation: s.explanation })),
    };
  }

  if (type === "FILL_IN_BLANK" && submission.type === "FILL_IN_BLANK") {
    const blanks = (data.blanks as { options?: string[]; answer: string }[]) ?? [];
    const correct = blanks.every((b, i) => matches(submission.values[i] ?? "", b.answer));
    return { type: "FILL_IN_BLANK", correct, blanks: blanks.map((b) => ({ answer: b.answer })) };
  }

  throw new Error(`Submission type "${submission.type}" does not match question type "${type}"`);
}
