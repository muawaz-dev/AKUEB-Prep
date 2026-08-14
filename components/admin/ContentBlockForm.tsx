"use client";

import { useState } from "react";
import type { BlockType, QuestionType } from "@/app/generated/prisma/enums";
import { MathKeyboardInput } from "@/components/MathKeyboardInput";

type BlockContent = {
  text?: string;
  youtubeId?: string;
  caption?: string;
  url?: string;
  alt?: string;
  latex?: string;
  problem?: string;
  solution?: string;
  title?: string;
  questionType?: QuestionType;
  prompt?: string;
  explanation?: string;
  choices?: string[];
  correctIndex?: number;
  answer?: number;
  tolerance?: number;
  acceptedAnswers?: string[];
  statements?: TrueFalseStatement[];
  statementText?: string;
  blanks?: BlankConfig[];
};

type TrueFalseStatement = { text: string; isTrue: boolean; explanation?: string };
type BlankConfig = { options?: string[]; answer: string };

// Admin marks each blank in the statement with three or more underscores,
// e.g. "The capital of France is ___.". This counts them so the blank
// config rows below can be kept in sync as the admin types.
const BLANK_MARKER = /_{3,}/g;
function countBlanks(statementText: string): number {
  return (statementText.match(BLANK_MARKER) ?? []).length;
}
function resizeBlanks(blanks: BlankConfig[], count: number): BlankConfig[] {
  if (count === blanks.length) return blanks;
  if (count < blanks.length) return blanks.slice(0, count);
  return [...blanks, ...Array.from({ length: count - blanks.length }, () => ({ options: [], answer: "" }))];
}

const BLOCK_TYPES: BlockType[] = ["TEXT", "VIDEO", "IMAGE", "FORMULA", "WORKED_EXAMPLE", "CALLOUT", "QUESTION"];
const QUESTION_TYPES: QuestionType[] = ["MCQ", "NUMERIC", "SHORT_TEXT", "TRUE_FALSE", "FILL_IN_BLANK"];

const inputClass = "border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent";

export function ContentBlockForm({
  owner,
  action,
  initial,
}: {
  owner: { field: "sloId"; id: string } | { field: "chapterId"; id: string };
  action: (formData: FormData) => void;
  initial?: {
    id: string;
    blockType: BlockType;
    orderIndex: number;
    content: BlockContent;
  };
}) {
  const [blockType, setBlockType] = useState<BlockType>(initial?.blockType ?? "TEXT");
  const [questionType, setQuestionType] = useState<QuestionType>(initial?.content.questionType ?? "MCQ");
  const content = initial?.content ?? {};
  const choices = content.choices ?? ["", "", "", ""];
  const [statements, setStatements] = useState<TrueFalseStatement[]>(
    content.statements?.length ? content.statements : [{ text: "", isTrue: true, explanation: "" }]
  );

  function updateStatement(index: number, patch: Partial<TrueFalseStatement>) {
    setStatements((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function removeStatement(index: number) {
    setStatements((prev) => prev.filter((_, i) => i !== index));
  }
  function addStatement() {
    setStatements((prev) => [...prev, { text: "", isTrue: true, explanation: "" }]);
  }

  const [statementText, setStatementText] = useState(content.statementText ?? "");
  const [blanks, setBlanks] = useState<BlankConfig[]>(
    resizeBlanks(content.blanks ?? [], countBlanks(content.statementText ?? ""))
  );

  function updateStatementText(text: string) {
    setStatementText(text);
    setBlanks((prev) => resizeBlanks(prev, countBlanks(text)));
  }
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(
    content.acceptedAnswers?.length ? content.acceptedAnswers : [""]
  );

  function updateAcceptedAnswer(index: number, value: string) {
    setAcceptedAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  }
  function removeAcceptedAnswer(index: number) {
    setAcceptedAnswers((prev) => prev.filter((_, i) => i !== index));
  }
  function addAcceptedAnswer() {
    setAcceptedAnswers((prev) => [...prev, ""]);
  }

  function updateBlank(index: number, patch: Partial<BlankConfig>) {
    setBlanks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="sloId" value={owner.field === "sloId" ? owner.id : ""} />
      <input type="hidden" name="chapterId" value={owner.field === "chapterId" ? owner.id : ""} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm flex-1">
          Type
          <select
            name="blockType"
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as BlockType)}
            className={inputClass}
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm w-24">
          Order
          <input name="orderIndex" type="number" defaultValue={initial?.orderIndex ?? 0} required className={inputClass} />
        </label>
      </div>

      {blockType === "TEXT" && (
        <label className="flex flex-col gap-1 text-sm">
          Text (Markdown: # headings, **bold**, - bullets, $x^2$ inline math, $$x^2$$ block math)
          <textarea name="text" defaultValue={content.text} required rows={6} className={inputClass} />
        </label>
      )}

      {blockType === "VIDEO" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            YouTube video ID (the part after v=)
            <input name="youtubeId" defaultValue={content.youtubeId} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Caption (optional)
            <input name="caption" defaultValue={content.caption} className={inputClass} />
          </label>
        </>
      )}

      {blockType === "IMAGE" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Image URL
            <input name="url" defaultValue={content.url} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Alt text (optional)
            <input name="alt" defaultValue={content.alt} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Caption (optional)
            <input name="caption" defaultValue={content.caption} className={inputClass} />
          </label>
        </>
      )}

      {blockType === "FORMULA" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            LaTeX (no $ delimiters needed, e.g. x^2 + 3x + 2)
            <input name="latex" defaultValue={content.latex} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Caption (optional)
            <input name="caption" defaultValue={content.caption} className={inputClass} />
          </label>
        </>
      )}

      {blockType === "WORKED_EXAMPLE" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Problem (Markdown + $math$ supported)
            <textarea name="problem" defaultValue={content.problem} required rows={3} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Solution (Markdown + $math$ supported)
            <textarea name="solution" defaultValue={content.solution} required rows={4} className={inputClass} />
          </label>
        </>
      )}

      {blockType === "CALLOUT" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Title (optional)
            <input name="title" defaultValue={content.title} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Text (Markdown + $math$ supported)
            <textarea name="text" defaultValue={content.text} required rows={3} className={inputClass} />
          </label>
        </>
      )}

      {blockType === "QUESTION" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Title (optional, shown above the question - e.g. &quot;Your turn!&quot;)
            <input name="title" defaultValue={content.title} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Prompt
            <textarea name="prompt" defaultValue={content.prompt} required rows={2} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Question type
            <select
              name="questionType"
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className={inputClass}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {questionType === "MCQ" && (
            <div className="flex flex-col gap-2">
              <span className="text-sm">Choices (mark the correct one)</span>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctIndex"
                    value={i}
                    defaultChecked={(content.correctIndex ?? 0) === i}
                    required
                  />
                  <input name={`choice${i}`} defaultValue={choices[i]} required className={`${inputClass} flex-1`} />
                </div>
              ))}
            </div>
          )}

          {questionType === "NUMERIC" && (
            <div className="flex gap-3">
              <label className="flex flex-col gap-1 text-sm flex-1">
                Answer
                <input name="answer" type="number" step="any" defaultValue={content.answer} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1">
                Tolerance
                <input name="tolerance" type="number" step="any" defaultValue={content.tolerance ?? 0} required className={inputClass} />
              </label>
            </div>
          )}

          {questionType === "SHORT_TEXT" && (
            <div className="flex flex-col gap-2">
              <span className="text-sm">Accepted answers (any of these counts as correct)</span>
              {acceptedAnswers.map((answer, i) => (
                <div key={i} className="flex items-start gap-2">
                  <MathKeyboardInput
                    name="acceptedAnswer"
                    value={answer}
                    onChange={(v) => updateAcceptedAnswer(i, v)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeAcceptedAnswer(i)}
                    disabled={acceptedAnswers.length <= 1}
                    className="text-sm text-red-600 hover:underline disabled:opacity-30 disabled:hover:no-underline shrink-0 mt-1.5"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAcceptedAnswer}
                className="text-sm border border-black/20 dark:border-white/20 rounded px-3 py-1.5 w-fit hover:bg-black/5 dark:hover:bg-white/5"
              >
                + Add accepted answer
              </button>
            </div>
          )}

          {questionType === "TRUE_FALSE" && (
            <div className="flex flex-col gap-3">
              <span className="text-sm">Statements (mark each True or False, add as many as you want)</span>
              {statements.map((statement, i) => (
                <div key={i} className="border border-black/10 dark:border-white/10 rounded p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      name="statementText"
                      value={statement.text}
                      onChange={(e) => updateStatement(i, { text: e.target.value })}
                      placeholder="Statement text"
                      required
                      className={`${inputClass} flex-1`}
                    />
                    <select
                      name="statementIsTrue"
                      value={statement.isTrue ? "true" : "false"}
                      onChange={(e) => updateStatement(i, { isTrue: e.target.value === "true" })}
                      className={inputClass}
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeStatement(i)}
                      disabled={statements.length <= 1}
                      className="text-sm text-red-600 hover:underline disabled:opacity-30 disabled:hover:no-underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    name="statementExplanation"
                    value={statement.explanation ?? ""}
                    onChange={(e) => updateStatement(i, { explanation: e.target.value })}
                    placeholder="Explanation shown after checking (optional)"
                    className={inputClass}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addStatement}
                className="text-sm border border-black/20 dark:border-white/20 rounded px-3 py-1.5 w-fit hover:bg-black/5 dark:hover:bg-white/5"
              >
                + Add statement
              </button>
            </div>
          )}

          {questionType === "FILL_IN_BLANK" && (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Statement (mark each blank with three or more underscores, e.g. &quot;The capital of France is ___.&quot;)
                <textarea
                  name="blankStatement"
                  value={statementText}
                  onChange={(e) => updateStatementText(e.target.value)}
                  required
                  rows={3}
                  className={inputClass}
                />
              </label>

              {blanks.length === 0 && (
                <p className="text-sm text-black/50 dark:text-white/50">
                  No blanks yet - add ___ to the statement above to create one.
                </p>
              )}

              {blanks.map((blank, i) => (
                <div key={i} className="border border-black/10 dark:border-white/10 rounded p-3 flex flex-col gap-2">
                  <span className="text-sm font-medium">Blank {i + 1}</span>
                  <label className="flex flex-col gap-1 text-sm">
                    Options (one per line, optional - leave blank so the student types a free-text answer)
                    <textarea
                      name="blankOptions"
                      value={(blank.options ?? []).join("\n")}
                      onChange={(e) =>
                        updateBlank(i, {
                          options: e.target.value
                            .split("\n")
                            .map((o) => o.trim())
                            .filter(Boolean),
                        })
                      }
                      rows={2}
                      className={inputClass}
                    />
                  </label>
                  {blank.options?.length ? (
                    <label className="flex flex-col gap-1 text-sm">
                      Correct answer (must match one of the options above)
                      <input
                        name="blankAnswer"
                        value={blank.answer}
                        onChange={(e) => updateBlank(i, { answer: e.target.value })}
                        placeholder="Correct answer"
                        required
                        className={inputClass}
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col gap-1 text-sm">
                      Correct answer
                      <MathKeyboardInput
                        name="blankAnswer"
                        value={blank.answer}
                        onChange={(v) => updateBlank(i, { answer: v })}
                        placeholder="Correct answer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm">
            Explanation (shown after answering, optional)
            <textarea name="explanation" defaultValue={content.explanation} rows={2} className={inputClass} />
          </label>
        </>
      )}

      <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium w-fit">
        {initial ? "Save block" : "Add block"}
      </button>
    </form>
  );
}
