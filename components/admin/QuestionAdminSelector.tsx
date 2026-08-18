"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { FilterClass } from "@/lib/questionBankFilterTree";

const inputClass = "border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent text-sm";
const disabledClass = "disabled:opacity-40";

// Class -> Subject -> Chapter -> Topic -> SLO, sourced from the full
// curriculum (every status, since this is for authoring/browsing including
// drafts) via real relations - not from Question rows, since Question has no
// bearing on what curriculum exists. Picking a level here just filters the
// list below and pre-fills "Add a question"; it does not restrict what the
// add-question form itself can be typed as - a brand new class/subject/
// chapter/topic/SLO with nothing here yet is created by just typing it
// directly into that form (see resolveLocation in actions.ts).
export function QuestionAdminSelector({ classes }: { classes: FilterClass[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId") ?? "";
  const subjectId = searchParams.get("subjectId") ?? "";
  const chapterId = searchParams.get("chapterId") ?? "";
  const topicId = searchParams.get("topicId") ?? "";
  const sloId = searchParams.get("sloId") ?? "";

  const selectedClass = classes.find((c) => c.id === classId);
  const subjects = selectedClass?.subjects ?? [];
  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const chapters = selectedSubject?.chapters ?? [];
  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const topics = selectedChapter?.topics ?? [];
  const selectedTopic = topics.find((t) => t.id === topicId);
  const slos = selectedTopic?.slos ?? [];

  function update(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        aria-label="Class"
        value={classId}
        onChange={(e) => update({ classId: e.target.value, subjectId: "", chapterId: "", topicId: "", sloId: "" })}
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
        value={subjectId}
        onChange={(e) => update({ subjectId: e.target.value, chapterId: "", topicId: "", sloId: "" })}
        disabled={!classId}
        className={`${inputClass} ${disabledClass}`}
      >
        <option value="">{classId ? "All subjects" : "Select class first"}</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Chapter"
        value={chapterId}
        onChange={(e) => update({ chapterId: e.target.value, topicId: "", sloId: "" })}
        disabled={!subjectId}
        className={`${inputClass} ${disabledClass}`}
      >
        <option value="">{subjectId ? "All chapters" : "Select subject first"}</option>
        {chapters.map((c) => (
          <option key={c.id} value={c.id}>
            Unit {c.orderIndex}: {c.title}
          </option>
        ))}
      </select>

      <select
        aria-label="Topic"
        value={topicId}
        onChange={(e) => update({ topicId: e.target.value, sloId: "" })}
        disabled={!chapterId}
        className={`${inputClass} ${disabledClass}`}
      >
        <option value="">{chapterId ? "All topics" : "Select chapter first"}</option>
        {topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.code}: {t.title}
          </option>
        ))}
      </select>

      <select
        aria-label="SLO"
        value={sloId}
        onChange={(e) => update({ sloId: e.target.value })}
        disabled={!topicId}
        className={`${inputClass} ${disabledClass}`}
      >
        <option value="">{topicId ? "All SLOs" : "Select topic first"}</option>
        {slos.map((s) => (
          <option key={s.id} value={s.id}>
            {s.code}
          </option>
        ))}
      </select>

      {(classId || subjectId || chapterId || topicId || sloId) && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-sm text-black/50 dark:text-white/50 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
