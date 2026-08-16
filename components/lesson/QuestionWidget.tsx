"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionType } from "@/app/generated/prisma/enums";
import { MarkdownContent } from "./MarkdownContent";
import { MathKeyboardInput } from "../MathKeyboardInput";

type TrueFalseStatement = { text: string; isTrue: boolean; explanation?: string };
type BlankConfig = { options?: string[]; answer: string };

type QuestionData = {
  choices?: string[];
  correctIndex?: number;
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
  prompt,
  data,
  explanation,
}: {
  type: QuestionType;
  title?: string;
  prompt: string;
  data: QuestionData;
  explanation: string | null;
}) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [numericInput, setNumericInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [tfSelections, setTfSelections] = useState<(boolean | null)[]>(
    () => (data.statements ?? []).map(() => null)
  );
  const [blankInputs, setBlankInputs] = useState<string[]>(() => (data.blanks ?? []).map(() => ""));
  const [checked, setChecked] = useState(false);
  const [openBlank, setOpenBlank] = useState<number | null>(null);
  const blankMenuRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

  const statements = data.statements ?? [];
  const segments = data.segments ?? [];
  const blanks = data.blanks ?? [];

  const isCorrect = (): boolean => {
    if (type === "MCQ") return selectedChoice === (data.correctIndex ?? -1);
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
    (type === "MCQ" && selectedChoice !== null) ||
    (type === "NUMERIC" && numericInput.trim() !== "") ||
    (type === "SHORT_TEXT" && textInput.trim() !== "") ||
    (type === "TRUE_FALSE" && statements.length > 0 && tfSelections.every((s) => s !== null)) ||
    (type === "FILL_IN_BLANK" && blanks.length > 0 && blankInputs.every((v) => v.trim() !== ""));

  const correct = checked && isCorrect();
  const tfCorrectCount = statements.filter((s, i) => tfSelections[i] === s.isTrue).length;
  const blankCorrectCount = blanks.filter((b, i) => matches(blankInputs[i] ?? "", b.answer)).length;
  const partsTotal = type === "TRUE_FALSE" ? statements.length : type === "FILL_IN_BLANK" ? blanks.length : 0;
  const partsCorrectCount = type === "TRUE_FALSE" ? tfCorrectCount : type === "FILL_IN_BLANK" ? blankCorrectCount : 0;

  return (
    <div className="rounded p-4 flex flex-col gap-3 bg-black/[0.04] dark:bg-white/[0.06]">
      {title && (
        <p className="text-center text-heading font-bold">
          <MarkdownContent text={title} inline />
        </p>
      )}
      <p className="text-lg font-medium">
        <MarkdownContent text={prompt} inline />
      </p>

      {type === "MCQ" && (
        <div className="flex flex-col gap-2">
          {(data.choices ?? []).map((choice, i) => (
            <label key={i} className="flex items-center gap-2 text-base">
              <input
                type="radio"
                name={`mcq-${prompt}`}
                checked={selectedChoice === i}
                onChange={() => {
                  setSelectedChoice(i);
                  setChecked(false);
                }}
              />
              <MarkdownContent text={choice} inline />
            </label>
          ))}
        </div>
      )}

      {type === "NUMERIC" && (
        <input
          type="number"
          value={numericInput}
          onChange={(e) => {
            setNumericInput(e.target.value);
            setChecked(false);
          }}
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent w-40"
        />
      )}

      {type === "SHORT_TEXT" && (
        <MathKeyboardInput
          value={textInput}
          onChange={(v) => {
            setTextInput(v);
            setChecked(false);
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
                      const showAsCorrectAnswer = checked && gotWrong && statement.isTrue === option;
                      return (
                        <button
                          key={String(option)}
                          type="button"
                          onClick={() => {
                            setTfSelections((prev) => prev.map((v, idx) => (idx === i ? option : v)));
                            setChecked(false);
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
                {checked && statement.explanation && (
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
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-base leading-8">
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
              <span key={i} className="inline-flex items-center gap-1.5 flex-wrap">
                {segments[i] && <MarkdownContent text={segments[i]} inline />}
                {blank.options?.length ? (
                  <span
                    ref={(el) => {
                      blankMenuRefs.current[i] = el;
                    }}
                    className="relative inline-block"
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
                              setChecked(false);
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
                      setChecked(false);
                    }}
                    className="w-56"
                    inputBoxClassName={stateClass}
                  />
                )}
                {gotWrong && (
                  <span className="text-xs text-green-700 dark:text-green-500">
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
        onClick={() => setChecked(true)}
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
          {explanation && (
            <p className="mt-1 text-black/70 dark:text-white/70">
              <MarkdownContent text={explanation} inline />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
