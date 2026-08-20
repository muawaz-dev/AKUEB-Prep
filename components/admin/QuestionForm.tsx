"use client";

import { useState } from "react";
import type { QuestionType, Difficulty, ContentStatus } from "@/app/generated/prisma/enums";
import type { FilterClass } from "@/lib/questionBankFilterTree";

type TrueFalseStatement = { text: string; isTrue: boolean; explanation?: string };
type BlankConfig = { options?: string[]; answer: string };

type QuestionData = {
  choices?: string[];
  correctIndex?: number;
  answer?: number;
  tolerance?: number;
  acceptedAnswers?: string[];
  statements?: TrueFalseStatement[];
  statementText?: string;
  segments?: string[];
  blanks?: BlankConfig[];
};

const QUESTION_TYPES: QuestionType[] = ["MCQ", "NUMERIC", "SHORT_TEXT", "TRUE_FALSE", "FILL_IN_BLANK"];
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const STATUSES: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const NEW = "__new__";

const inputClass = "border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent";
const selectDisabledClass = "disabled:opacity-40";

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

export function QuestionForm({
  classes,
  action,
  initial,
  defaultLocation,
}: {
  // The full curriculum tree (Class -> Subject -> Chapter -> Topic -> SLO),
  // same shape used by QuestionAdminSelector and the public question-bank
  // filters, so picking a location here works identically to browsing there
  // - cascading dropdowns, not free text. Each level also offers "+ Add new"
  // for content that doesn't exist yet (no Course required, see Chapter's
  // model comment in schema.prisma) - only that path involves typing, so
  // typos can only ever create a new row, never silently mismatch an
  // existing one.
  classes: FilterClass[];
  action: (formData: FormData) => void;
  initial?: {
    id: string;
    classId: string;
    subjectId: string;
    chapterId: string | null;
    topicId: string | null;
    sloId: string | null;
    type: QuestionType;
    prompt: string;
    difficulty: Difficulty;
    pastPaper: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    status: ContentStatus;
    explanation: string | null;
    data: QuestionData;
  };
  // Pre-selects a fresh (non-editing) form's location from whatever is
  // currently selected in QuestionAdminSelector.
  defaultLocation?: { classId?: string; subjectId?: string; chapterId?: string; topicId?: string; sloId?: string };
}) {
  const [type, setType] = useState<QuestionType>(initial?.type ?? "MCQ");
  const data = initial?.data ?? {};
  const choices = data.choices ?? ["", "", "", ""];

  const [statements, setStatements] = useState<TrueFalseStatement[]>(
    data.statements?.length ? data.statements : [{ text: "", isTrue: true, explanation: "" }]
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

  // Older saved questions only have `segments` (statementText wasn't persisted
  // until this was fixed) - rejoin them so those records don't show empty.
  const [statementText, setStatementText] = useState(
    data.statementText ?? data.segments?.join("___") ?? ""
  );
  const [blanks, setBlanks] = useState<BlankConfig[]>(
    resizeBlanks(data.blanks ?? [], countBlanks(data.statementText ?? ""))
  );
  function updateStatementText(text: string) {
    setStatementText(text);
    setBlanks((prev) => resizeBlanks(prev, countBlanks(text)));
  }
  function updateBlank(index: number, patch: Partial<BlankConfig>) {
    setBlanks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  // ---- Location: Class -> Subject -> Chapter -> Topic -> SLO cascade ----
  const [classSel, setClassSel] = useState(initial?.classId ?? defaultLocation?.classId ?? "");
  const [newClassLevel, setNewClassLevel] = useState("");
  const [subjectSel, setSubjectSel] = useState(initial?.subjectId ?? defaultLocation?.subjectId ?? "");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [chapterSel, setChapterSel] = useState(initial?.chapterId ?? defaultLocation?.chapterId ?? "");
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterOrder, setNewChapterOrder] = useState("");
  const [topicSel, setTopicSel] = useState(initial?.topicId ?? defaultLocation?.topicId ?? "");
  const [newTopicCode, setNewTopicCode] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [sloSel, setSloSel] = useState(initial?.sloId ?? defaultLocation?.sloId ?? "");
  const [newSloCode, setNewSloCode] = useState("");
  const [newSloText, setNewSloText] = useState("");
  const [newCognitiveLevel, setNewCognitiveLevel] = useState("");

  const selectedClass = classes.find((c) => c.id === classSel);
  const subjects = selectedClass?.subjects ?? [];
  const selectedSubject = subjects.find((s) => s.id === subjectSel);
  const chapters = selectedSubject?.chapters ?? [];
  const selectedChapter = chapters.find((c) => c.id === chapterSel);
  const topics = selectedChapter?.topics ?? [];
  const selectedTopic = topics.find((t) => t.id === topicSel);
  const slos = selectedTopic?.slos ?? [];
  const selectedSlo = slos.find((s) => s.id === sloSel);

  function onClassChange(v: string) {
    setClassSel(v);
    setSubjectSel("");
    setChapterSel("");
    setTopicSel("");
    setSloSel("");
  }
  function onSubjectChange(v: string) {
    setSubjectSel(v);
    setChapterSel("");
    setTopicSel("");
    setSloSel("");
  }
  function onChapterChange(v: string) {
    setChapterSel(v);
    setTopicSel("");
    setSloSel("");
  }
  function onTopicChange(v: string) {
    setTopicSel(v);
    setSloSel("");
  }

  // What actually gets submitted - resolveLocation (see actions.ts) matches
  // these against existing rows, or creates them if nothing matches. Whether
  // the admin picked an existing option or typed a new one, the right value
  // ends up here either way.
  const classLevelValue = classSel === NEW ? newClassLevel : String(selectedClass?.level ?? "");
  const subjectValue = subjectSel === NEW ? newSubjectName : (selectedSubject?.name ?? "");
  const chapterValue = chapterSel === NEW ? newChapterTitle : (selectedChapter?.title ?? "");
  const chapterOrderValue = chapterSel === NEW ? newChapterOrder : "";
  const topicCodeValue = topicSel === NEW ? newTopicCode : (selectedTopic?.code ?? "");
  const topicTitleValue = topicSel === NEW ? newTopicTitle : (selectedTopic?.title ?? "");
  const sloCodeValue = sloSel === NEW ? newSloCode : (selectedSlo?.code ?? "");
  const sloTextValue = sloSel === NEW ? newSloText : "";
  const cognitiveLevelValue = sloSel === NEW ? newCognitiveLevel : "";

  return (
    <form action={action} className="flex flex-col gap-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="classLevel" value={classLevelValue} />
      <input type="hidden" name="subject" value={subjectValue} />
      <input type="hidden" name="chapter" value={chapterValue} />
      <input type="hidden" name="chapterOrder" value={chapterOrderValue} />
      <input type="hidden" name="topicCode" value={topicCodeValue} />
      <input type="hidden" name="topicTitle" value={topicTitleValue} />
      <input type="hidden" name="sloCode" value={sloCodeValue} />
      <input type="hidden" name="sloText" value={sloTextValue} />
      <input type="hidden" name="cognitiveLevel" value={cognitiveLevelValue} />

      <div className="flex flex-col gap-3 border border-black/10 dark:border-white/10 rounded p-3">
        <span className="text-sm font-medium">Location</span>

        <div className="flex gap-3 flex-wrap">
          <label className="flex flex-col gap-1 text-sm w-40">
            Class
            <select value={classSel} onChange={(e) => onClassChange(e.target.value)} required className={inputClass}>
              <option value="" disabled>
                Select class
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.level}
                </option>
              ))}
              <option value={NEW}>+ Add new class</option>
            </select>
          </label>
          {classSel === NEW && (
            <label className="flex flex-col gap-1 text-sm w-32">
              New class level
              <input
                type="number"
                value={newClassLevel}
                onChange={(e) => setNewClassLevel(e.target.value)}
                required
                className={inputClass}
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm flex-1 min-w-40">
            Subject
            <select
              value={subjectSel}
              onChange={(e) => onSubjectChange(e.target.value)}
              disabled={!classSel}
              required
              className={`${inputClass} ${selectDisabledClass}`}
            >
              <option value="" disabled>
                {classSel ? "Select subject" : "Select class first"}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              {classSel && <option value={NEW}>+ Add new subject</option>}
            </select>
          </label>
          {subjectSel === NEW && (
            <label className="flex flex-col gap-1 text-sm flex-1 min-w-40">
              New subject name
              <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} required className={inputClass} />
            </label>
          )}
        </div>

        <p className="text-xs text-black/50 dark:text-white/50">
          Chapter/topic/SLO below are optional and get more specific as you go.
        </p>

        <div className="flex gap-3 flex-wrap items-end">
          <label className="flex flex-col gap-1 text-sm flex-1 min-w-48">
            Chapter
            <select
              value={chapterSel}
              onChange={(e) => onChapterChange(e.target.value)}
              disabled={!subjectSel}
              className={`${inputClass} ${selectDisabledClass}`}
            >
              <option value="">{subjectSel ? "None" : "Select subject first"}</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Unit {c.orderIndex}: {c.title}
                </option>
              ))}
              {subjectSel && <option value={NEW}>+ Add new chapter</option>}
            </select>
          </label>
          {chapterSel === NEW && (
            <>
              <label className="flex flex-col gap-1 text-sm flex-1 min-w-40">
                New chapter title
                <input value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} required className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm w-28">
                Order
                <input
                  type="number"
                  value={newChapterOrder}
                  onChange={(e) => setNewChapterOrder(e.target.value)}
                  placeholder="auto"
                  className={inputClass}
                />
              </label>
            </>
          )}
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <label className="flex flex-col gap-1 text-sm flex-1 min-w-48">
            Topic
            <select
              value={topicSel}
              onChange={(e) => onTopicChange(e.target.value)}
              disabled={!chapterSel || chapterSel === NEW}
              className={`${inputClass} ${selectDisabledClass}`}
            >
              <option value="">
                {!chapterSel ? "Select chapter first" : chapterSel === NEW ? "Save chapter first" : "None"}
              </option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code}: {t.title}
                </option>
              ))}
              {chapterSel && chapterSel !== NEW && <option value={NEW}>+ Add new topic</option>}
            </select>
          </label>
          {topicSel === NEW && (
            <>
              <label className="flex flex-col gap-1 text-sm w-28">
                New topic code
                <input
                  value={newTopicCode}
                  onChange={(e) => setNewTopicCode(e.target.value)}
                  placeholder="e.g. 1.1"
                  required
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1 min-w-40">
                New topic title
                <input value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} className={inputClass} />
              </label>
            </>
          )}
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <label className="flex flex-col gap-1 text-sm flex-1 min-w-48">
            SLO
            <select
              value={sloSel}
              onChange={(e) => setSloSel(e.target.value)}
              disabled={!topicSel || topicSel === NEW}
              className={`${inputClass} ${selectDisabledClass}`}
            >
              <option value="">{!topicSel ? "Select topic first" : topicSel === NEW ? "Save topic first" : "None"}</option>
              {slos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
              {topicSel && topicSel !== NEW && <option value={NEW}>+ Add new SLO</option>}
            </select>
          </label>
          {sloSel === NEW && (
            <>
              <label className="flex flex-col gap-1 text-sm w-28">
                New SLO code
                <input
                  value={newSloCode}
                  onChange={(e) => setNewSloCode(e.target.value)}
                  placeholder="e.g. 1.1.1"
                  required
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1 min-w-40">
                New SLO text
                <input value={newSloText} onChange={(e) => setNewSloText(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1 text-sm w-28">
                Cognitive level
                <input
                  value={newCognitiveLevel}
                  onChange={(e) => setNewCognitiveLevel(e.target.value)}
                  placeholder="e.g. A"
                  className={inputClass}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Image URL (optional, rendered above the prompt)
        <input name="imageUrl" defaultValue={initial?.imageUrl ?? ""} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Image alt text (optional)
        <input name="imageAlt" defaultValue={initial?.imageAlt ?? ""} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Prompt (Markdown + $math$ supported)
        <textarea name="prompt" defaultValue={initial?.prompt} required rows={2} className={inputClass} />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-col gap-1 text-sm flex-1">
          Type
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className={inputClass}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm flex-1">
          Difficulty
          <select name="difficulty" defaultValue={initial?.difficulty ?? "MEDIUM"} className={inputClass}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        {initial && (
          <label className="flex flex-col gap-1 text-sm flex-1">
            Status
            <select name="status" defaultValue={initial.status} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Past paper (optional, e.g. &quot;AKU-EB 2023 Annual&quot;)
        <input name="pastPaper" defaultValue={initial?.pastPaper ?? ""} className={inputClass} />
      </label>

      {type === "MCQ" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm">Choices (mark the correct one - Markdown + $math$ supported)</span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctIndex"
                value={i}
                defaultChecked={(data.correctIndex ?? 0) === i}
                required
              />
              <input name={`choice${i}`} defaultValue={choices[i]} required className={`${inputClass} flex-1`} />
            </div>
          ))}
        </div>
      )}

      {type === "NUMERIC" && (
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm flex-1">
            Answer
            <input name="answer" type="number" step="any" defaultValue={data.answer} required className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm flex-1">
            Tolerance
            <input name="tolerance" type="number" step="any" defaultValue={data.tolerance ?? 0} required className={inputClass} />
          </label>
        </div>
      )}

      {type === "SHORT_TEXT" && (
        <label className="flex flex-col gap-1 text-sm">
          Accepted answers (one per line)
          <textarea
            name="acceptedAnswers"
            defaultValue={(data.acceptedAnswers ?? []).join("\n")}
            required
            rows={3}
            className={inputClass}
          />
        </label>
      )}

      {type === "TRUE_FALSE" && (
        <div className="flex flex-col gap-3">
          <span className="text-sm">
            Statements (mark each True or False, add as many as you want - Markdown + $math$ supported)
          </span>
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

      {type === "FILL_IN_BLANK" && (
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
              <label className="flex flex-col gap-1 text-sm">
                Correct answer
                <input
                  name="blankAnswer"
                  value={blank.answer}
                  onChange={(e) => updateBlank(i, { answer: e.target.value })}
                  placeholder="Correct answer"
                  required
                  className={inputClass}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Explanation (shown after answering, optional - Markdown + $math$ supported)
        <textarea name="explanation" defaultValue={initial?.explanation ?? ""} rows={2} className={inputClass} />
      </label>

      <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium w-fit">
        {initial ? "Save question" : "Add question"}
      </button>
    </form>
  );
}
