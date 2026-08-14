"use client";

import { useState } from "react";
import type { QuestionType, Difficulty, ContentStatus } from "@/app/generated/prisma/enums";

type QuestionData = {
  choices?: string[];
  correctIndex?: number;
  answer?: number;
  tolerance?: number;
  acceptedAnswers?: string[];
};

const QUESTION_TYPES: QuestionType[] = ["MCQ", "NUMERIC", "SHORT_TEXT"];
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const STATUSES: ContentStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const inputClass = "border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent";

export function QuestionForm({
  sloId,
  action,
  initial,
}: {
  sloId: string;
  action: (formData: FormData) => void;
  initial?: {
    id: string;
    type: QuestionType;
    prompt: string;
    difficulty: Difficulty;
    status: ContentStatus;
    explanation: string | null;
    data: QuestionData;
  };
}) {
  const [type, setType] = useState<QuestionType>(initial?.type ?? "MCQ");
  const data = initial?.data ?? {};
  const choices = data.choices ?? ["", "", "", ""];

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="sloId" value={sloId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1 text-sm">
        Prompt
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

      {type === "MCQ" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm">Choices (mark the correct one)</span>
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

      <label className="flex flex-col gap-1 text-sm">
        Explanation (shown after answering, optional)
        <textarea name="explanation" defaultValue={initial?.explanation ?? ""} rows={2} className={inputClass} />
      </label>

      <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium w-fit">
        {initial ? "Save question" : "Add question"}
      </button>
    </form>
  );
}
