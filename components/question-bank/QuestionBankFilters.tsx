"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { FilterClass } from "@/lib/questionBankFilterTree";

type Pending = {
  classId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  sloId: string;
  difficulty: string;
  pastPaper: string;
  sort: string;
};

const inputClass = "border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent text-sm";
const disabledClass = "disabled:opacity-40";

function pendingFromParams(params: URLSearchParams): Pending {
  return {
    classId: params.get("classId") ?? "",
    subjectId: params.get("subjectId") ?? "",
    chapterId: params.get("chapterId") ?? "",
    topicId: params.get("topicId") ?? "",
    sloId: params.get("sloId") ?? "",
    difficulty: params.get("difficulty") ?? "",
    pastPaper: params.get("pastPaper") ?? "",
    sort: params.get("sort") ?? "",
  };
}

const EMPTY_PENDING: Pending = {
  classId: "",
  subjectId: "",
  chapterId: "",
  topicId: "",
  sloId: "",
  difficulty: "",
  pastPaper: "",
  sort: "",
};

type PastPaperRow = {
  pastPaper: string;
  classId: string;
  subjectId: string;
  chapterId: string | null;
  topicId: string | null;
  sloId: string | null;
};

// Class -> Subject -> Chapter -> Topic -> SLO cascade down to narrower and
// narrower option lists; picking a level resets every level below it that no
// longer applies. Selections are staged locally and only turn into an actual
// query (a navigation, which re-fetches on the server) when "Apply filters"
// is pressed - not on every individual select change. Past Paper narrows
// with everything selected above it too (computed client-side from the raw
// rows, since it's not part of the class/subject/chapter/topic/slo tree
// itself), so it never offers a paper with zero matching questions for the
// current selection.
export function QuestionBankFilters({ classes, pastPaperRows }: { classes: FilterClass[]; pastPaperRows: PastPaperRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pending, setPending] = useState<Pending>(() => pendingFromParams(searchParams));

  function set(patch: Partial<Pending>) {
    setPending((prev) => ({ ...prev, ...patch }));
  }

  const selectedClass = classes.find((c) => c.id === pending.classId);
  const subjects = selectedClass?.subjects ?? [];
  const selectedSubject = subjects.find((s) => s.id === pending.subjectId);
  const chapters = selectedSubject?.chapters ?? [];
  const selectedChapter = chapters.find((c) => c.id === pending.chapterId);
  const topics = selectedChapter?.topics ?? [];
  const selectedTopic = topics.find((t) => t.id === pending.topicId);
  const slos = selectedTopic?.slos ?? [];

  const pastPapers = Array.from(
    new Set(
      pastPaperRows
        .filter((r) => !pending.classId || r.classId === pending.classId)
        .filter((r) => !pending.subjectId || r.subjectId === pending.subjectId)
        .filter((r) => !pending.chapterId || r.chapterId === pending.chapterId)
        .filter((r) => !pending.topicId || r.topicId === pending.topicId)
        .filter((r) => !pending.sloId || r.sloId === pending.sloId)
        .map((r) => r.pastPaper)
    )
  ).sort();

  function applyFilters() {
    const params = new URLSearchParams();
    if (pending.classId) params.set("classId", pending.classId);
    if (pending.subjectId) params.set("subjectId", pending.subjectId);
    if (pending.chapterId) params.set("chapterId", pending.chapterId);
    if (pending.topicId) params.set("topicId", pending.topicId);
    if (pending.sloId) params.set("sloId", pending.sloId);
    if (pending.difficulty) params.set("difficulty", pending.difficulty);
    if (pending.pastPaper) params.set("pastPaper", pending.pastPaper);
    if (pending.sort) params.set("sort", pending.sort);
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  function clearFilters() {
    setPending(EMPTY_PENDING);
    router.push(pathname);
  }

  const appliedCount = Array.from(searchParams.keys()).length;
  const isDirty = JSON.stringify(pending) !== JSON.stringify(pendingFromParams(searchParams));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Class"
          value={pending.classId}
          onChange={(e) => set({ classId: e.target.value, subjectId: "", chapterId: "", topicId: "", sloId: "" })}
          className={inputClass}
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Class {c.level}
            </option>
          ))}
        </select>

        <select
          aria-label="Subject"
          value={pending.subjectId}
          onChange={(e) => set({ subjectId: e.target.value, chapterId: "", topicId: "", sloId: "" })}
          disabled={!pending.classId}
          className={`${inputClass} ${disabledClass}`}
        >
          <option value="">{pending.classId ? "All subjects" : "Select class first"}</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Chapter"
          value={pending.chapterId}
          onChange={(e) => set({ chapterId: e.target.value, topicId: "", sloId: "" })}
          disabled={!pending.subjectId}
          className={`${inputClass} ${disabledClass}`}
        >
          <option value="">{pending.subjectId ? "All chapters" : "Select subject first"}</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              Unit {c.orderIndex}: {c.title}
            </option>
          ))}
        </select>

        <select
          aria-label="Topic"
          value={pending.topicId}
          onChange={(e) => set({ topicId: e.target.value, sloId: "" })}
          disabled={!pending.chapterId}
          className={`${inputClass} ${disabledClass}`}
        >
          <option value="">{pending.chapterId ? "All topics" : "Select chapter first"}</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code}: {t.title}
            </option>
          ))}
        </select>

        <select
          aria-label="SLO"
          value={pending.sloId}
          onChange={(e) => set({ sloId: e.target.value })}
          disabled={!pending.topicId}
          className={`${inputClass} ${disabledClass}`}
        >
          <option value="">{pending.topicId ? "All SLOs" : "Select topic first"}</option>
          {slos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code}
            </option>
          ))}
        </select>

        <select
          aria-label="Difficulty"
          value={pending.difficulty}
          onChange={(e) => set({ difficulty: e.target.value })}
          className={inputClass}
        >
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          aria-label="Past paper"
          value={pending.pastPaper}
          onChange={(e) => set({ pastPaper: e.target.value })}
          disabled={!pending.subjectId}
          className={`${inputClass} ${disabledClass}`}
        >
          <option value="">
            {!pending.classId ? "Select class first" : !pending.subjectId ? "Select subject first" : "All past papers"}
          </option>
          {pastPapers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Sort"
          value={pending.sort}
          onChange={(e) => set({ sort: e.target.value })}
          className={inputClass}
        >
          <option value="">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="easiest">Difficulty: Easy to Hard</option>
          <option value="hardest">Difficulty: Hard to Easy</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={applyFilters}
          disabled={!isDirty}
          className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          Apply filters
        </button>
        {appliedCount > 0 && (
          <button type="button" onClick={clearFilters} className="text-sm text-black/50 dark:text-white/50 hover:underline">
            Clear filters
          </button>
        )}
        {isDirty && <span className="text-xs text-black/40 dark:text-white/40">Filters changed - press Apply to search.</span>}
      </div>
    </div>
  );
}
