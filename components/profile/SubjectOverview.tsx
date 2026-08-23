"use client";

import { useState, useTransition } from "react";
import { getSubjectOverview, type ChapterOverview } from "@/app/(main)/profile/actions";

const fieldClass =
  "[color-scheme:light] dark:[color-scheme:dark] rounded-lg border border-black/15 dark:border-white/20 " +
  "bg-white dark:bg-white/10 px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors " +
  "hover:border-black/30 dark:hover:border-white/40 " +
  "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/30";

// Mirrors QuestionList's own per-item structure (components/question-bank/QuestionList.tsx)
// - an uppercase breadcrumb-style label on the left, status badges on the
// right, rows separated by a bottom border - so the chapter breakdown reads
// as the same kind of list as the question bank itself, one level up.
function ChapterRow({ chapter, isLast }: { chapter: ChapterOverview; isLast: boolean }) {
  const pct = chapter.accuracy === null ? null : Math.round(chapter.accuracy * 100);
  const badgeClass =
    pct === null
      ? "border-black/20 dark:border-white/20 text-black/60 dark:text-white/60"
      : pct >= 80
        ? "border-green-600 text-green-700 dark:text-green-500"
        : pct < 50
          ? "border-red-600 text-red-700 dark:text-red-500"
          : "border-amber-600 text-amber-700 dark:text-amber-500";

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${isLast ? "" : "pb-4 mb-4 border-b border-black/10 dark:border-white/10"}`}>
      <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
        Unit {chapter.orderIndex} - {chapter.title}
      </span>
      <span className={`text-xs font-medium rounded px-2 py-0.5 border ${badgeClass}`}>
        {pct === null ? "Not started" : `${chapter.solved}/${chapter.attempted} solved · ${pct}%`}
      </span>
    </div>
  );
}

export function SubjectOverview({ subjects, hasClass }: { subjects: { id: string; name: string }[]; hasClass: boolean }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [chapters, setChapters] = useState<ChapterOverview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasClass) {
    return <p className="text-sm text-black/50 dark:text-white/50">Set your class above to see a subject overview.</p>;
  }

  function loadOverview() {
    if (!subjectId) return;
    setError(null);
    startTransition(async () => {
      try {
        setChapters(await getSubjectOverview(subjectId));
      } catch {
        setError("Couldn't load the subject overview.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-black/50 dark:text-white/50">
          <span className="uppercase tracking-wide">Subject</span>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setChapters(null);
            }}
            className={fieldClass}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={loadOverview}
          disabled={pending || !subjectId}
          className="bg-black text-white dark:bg-white dark:text-black rounded px-4 py-2.5 text-sm font-medium disabled:opacity-40 w-fit"
        >
          {pending ? "Loading..." : "Subject overview"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {chapters &&
        (chapters.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40">No chapters published for this subject yet.</p>
        ) : (
          <div>
            {chapters.map((c, i) => (
              <ChapterRow key={c.chapterId} chapter={c} isLast={i === chapters.length - 1} />
            ))}
          </div>
        ))}
    </div>
  );
}
