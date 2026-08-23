"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import type { FilterClass } from "@/lib/questionBankFilterTree";
import { classLevelToSlug, slugify } from "@/lib/slugFormat";
import { Spinner } from "@/components/Spinner";

// Must render as a descendant of the <Link> it reports on (see
// components/Spinner.tsx and next/link's useLinkStatus) - shows a spinner
// only while that specific Link's navigation is actually in flight. If the
// destination was already prefetched (the normal case, since Link prefetches
// by default), `pending` never turns true and this never renders at all.
function ApplyFiltersStatus() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Spinner className="ml-2 border-white/40 border-t-white" />;
}

export type Pending = {
  classId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  sloId: string;
  difficulty: string;
  pastPaper: string;
  questionType: string;
  solved: string;
  sort: string;
};

// Seeds the initial selection on a /question-bank/[classLevel]/[subject]/...
// page, whose class/subject/chapter/pastPaper aren't in the query string at
// all (they're in the URL path) - otherwise the dropdowns would show "All
// classes" on a page that's clearly scoped to one. Doesn't disable anything;
// changing one of these is just a normal filter change (see computeDestination).
export type InitialFilters = Partial<Pick<Pending, "classId" | "subjectId" | "chapterId" | "pastPaper">>;

const selectClass =
  // The open dropdown list is native UA chrome our CSS can't reach; only
  // color-scheme tells the browser which built-in popup palette (dark bg +
  // light text, vs. the default light one) to draw it with. Setting it
  // directly on the <select> rather than relying on inheritance from
  // <html class="dark"> avoids a Chrome quirk where the popup still picks
  // the light default despite an inherited dark color-scheme.
  "[color-scheme:light] dark:[color-scheme:dark] " +
  "peer w-full appearance-none rounded-lg border border-black/15 dark:border-white/20 bg-white dark:bg-white/10 " +
  "pl-3 pr-9 py-2.5 text-sm font-medium text-foreground shadow-sm outline-none transition-colors " +
  "hover:border-black/30 dark:hover:border-white/40 " +
  "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/30 " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/15 dark:disabled:hover:border-white/20";

// Native <select> arrows can't be restyled directly (appearance-none strips
// the OS one entirely), so this SVG chevron sits on top instead - rotated
// via peer state when the trigger is focused/open, mirroring the select's
// own interaction rather than just a static decoration.
function SelectChevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40 transition-transform peer-focus-visible:rotate-180 peer-disabled:opacity-40"
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-black/50 dark:text-white/50">
      <span className="uppercase tracking-wide">{label}</span>
      <span className="relative block">{children}</span>
    </label>
  );
}

function pendingFromParams(params: URLSearchParams): Pending {
  return {
    classId: params.get("classId") ?? "",
    subjectId: params.get("subjectId") ?? "",
    chapterId: params.get("chapterId") ?? "",
    topicId: params.get("topicId") ?? "",
    sloId: params.get("sloId") ?? "",
    difficulty: params.get("difficulty") ?? "",
    pastPaper: params.get("pastPaper") ?? "",
    questionType: params.get("questionType") ?? "",
    solved: params.get("solved") ?? "",
    sort: params.get("sort") ?? "",
  };
}

type PastPaperRow = {
  pastPaper: string;
  classId: string;
  subjectId: string;
  chapterId: string | null;
  topicId: string | null;
  sloId: string | null;
};

// Whatever a selection resolves to, there's exactly one canonical URL for
// it: /question-bank once no class+subject is chosen yet, otherwise
// /question-bank/[classLevel]/[subject], further narrowed to a chapter or
// past-paper page if one of those is also selected. Anything left over
// (topic, SLO, difficulty, sort, or whichever of chapter/pastPaper wasn't
// absorbed into the path) rides along as query params on that URL. This is
// what lets "Apply filters" work identically whether you started on the
// plain explorer or a pre-filtered page - same function either way.
function computeDestination(
  pending: Pending,
  classes: FilterClass[]
): { path: string; query: URLSearchParams } {
  const remaining: Partial<Pending> = { ...pending };

  const cls = classes.find((c) => c.id === pending.classId);

  let path = "/question-bank";
  if (cls) {
    path += `/${classLevelToSlug(cls.level)}`;
    delete remaining.classId;

    const subject = cls.subjects.find((s) => s.id === pending.subjectId);
    if (subject) {
      path += `/${slugify(subject.name)}`;
      delete remaining.subjectId;

      const chapter = subject.chapters.find((c) => c.id === pending.chapterId);
      if (chapter) {
        path += `/${slugify(chapter.title)}`;
        delete remaining.chapterId;
      } else if (pending.pastPaper) {
        path += `/past-papers/${slugify(pending.pastPaper)}`;
        delete remaining.pastPaper;
      }
    }
  }

  const query = new URLSearchParams();
  (Object.keys(remaining) as (keyof Pending)[]).forEach((key) => {
    if (remaining[key]) query.set(key, remaining[key] as string);
  });
  return { path, query };
}

// Class -> Subject -> Chapter -> Topic -> SLO cascade down to narrower and
// narrower option lists; picking a level resets every level below it that no
// longer applies. Selections are staged locally and only turn into an actual
// navigation when "Apply filters" is pressed - not on every individual select
// change. Past Paper narrows with everything selected above it too (computed
// client-side from the raw rows, since it's not part of the class/subject/
// chapter/topic/slo tree itself), so it never offers a paper with zero
// matching questions for the current selection.
export function QuestionBankFilters({
  classes,
  pastPaperRows,
  initial,
}: {
  classes: FilterClass[];
  pastPaperRows: PastPaperRow[];
  initial?: InitialFilters;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const baseline: Pending = { ...pendingFromParams(searchParams), ...initial };
  const [pending, setPending] = useState<Pending>(baseline);

  // Resolved client-side (never blocking the initial, cacheable render with
  // a getCurrentUser() call of its own) - the "Solved" filter only makes
  // sense once you're logged in, since buildWhere treats a logged-out
  // solved=true/false as "match nothing"/"match everything" (see
  // lib/questionBankQuery.ts) rather than an actual per-user answer.
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => res.json())
      .then((data: { loggedIn: boolean }) => {
        if (!cancelled) setLoggedIn(data.loggedIn);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Real <Link>s rather than a button + router.push - Next.js only
  // prefetches a destination's loading state (and, where possible, its
  // data) for <Link>, not for an imperative push() call. Without that
  // prefetch, "instant loading state on navigation" doesn't apply: the
  // click has to cold-start the whole round trip before anything can show.
  const { path: applyPath, query: applyQuery } = computeDestination(pending, classes);
  const applyQs = applyQuery.toString();
  const applyHref = applyQs ? `${applyPath}?${applyQs}` : applyPath;

  const appliedCount = Array.from(searchParams.keys()).length;
  const isDirty = JSON.stringify(pending) !== JSON.stringify(baseline);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.02] p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <FilterField label="Class">
          <select
            aria-label="Class"
            value={pending.classId}
            onChange={(e) =>
              set({ classId: e.target.value, subjectId: "", chapterId: "", topicId: "", sloId: "", pastPaper: "" })
            }
            className={selectClass}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.level}
              </option>
            ))}
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="Subject">
          <select
            aria-label="Subject"
            value={pending.subjectId}
            onChange={(e) => set({ subjectId: e.target.value, chapterId: "", topicId: "", sloId: "", pastPaper: "" })}
            disabled={!pending.classId}
            className={selectClass}
          >
            <option value="">{pending.classId ? "All subjects" : "Select class first"}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="Chapter">
          <select
            aria-label="Chapter"
            value={pending.chapterId}
            onChange={(e) => set({ chapterId: e.target.value, topicId: "", sloId: "" })}
            disabled={!pending.subjectId}
            className={selectClass}
          >
            <option value="">{pending.subjectId ? "All chapters" : "Select subject first"}</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                Unit {c.orderIndex}: {c.title}
              </option>
            ))}
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="Topic">
          <select
            aria-label="Topic"
            value={pending.topicId}
            onChange={(e) => set({ topicId: e.target.value, sloId: "" })}
            disabled={!pending.chapterId}
            className={selectClass}
          >
            <option value="">{pending.chapterId ? "All topics" : "Select chapter first"}</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code}: {t.title}
              </option>
            ))}
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="SLO">
          <select
            aria-label="SLO"
            value={pending.sloId}
            onChange={(e) => set({ sloId: e.target.value })}
            disabled={!pending.topicId}
            className={selectClass}
          >
            <option value="">{pending.topicId ? "All SLOs" : "Select topic first"}</option>
            {slos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="Difficulty">
          <select
            aria-label="Difficulty"
            value={pending.difficulty}
            onChange={(e) => set({ difficulty: e.target.value })}
            className={selectClass}
          >
            <option value="">All difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="Type">
          <select
            aria-label="Type"
            value={pending.questionType}
            onChange={(e) => set({ questionType: e.target.value })}
            className={selectClass}
          >
            <option value="">All types</option>
            <option value="OBJECTIVE">Objective (MCQs)</option>
            <option value="SUBJECTIVE">Subjective (non-MCQ)</option>
          </select>
          <SelectChevron />
        </FilterField>

        {loggedIn && (
          <FilterField label="Solved">
            <select
              aria-label="Solved"
              value={pending.solved}
              onChange={(e) => set({ solved: e.target.value })}
              className={selectClass}
            >
              <option value="">All questions</option>
              <option value="true">Solved</option>
              <option value="false">Not solved</option>
            </select>
            <SelectChevron />
          </FilterField>
        )}

        <FilterField label="Past paper">
          <select
            aria-label="Past paper"
            value={pending.pastPaper}
            onChange={(e) => set({ pastPaper: e.target.value })}
            disabled={!pending.subjectId}
            className={selectClass}
          >
            <option value="">
              {!pending.classId ? "Select class first" : !pending.subjectId ? "Select subject first" : "All Sources"}
            </option>
            {pastPapers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <SelectChevron />
        </FilterField>

        <FilterField label="Sort">
          <select
            aria-label="Sort"
            value={pending.sort}
            onChange={(e) => set({ sort: e.target.value })}
            className={selectClass}
          >
            <option value="">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="easiest">Difficulty: Easy to Hard</option>
            <option value="hardest">Difficulty: Hard to Easy</option>
          </select>
          <SelectChevron />
        </FilterField>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-black/10 dark:border-white/10">
        {isDirty ? (
          <Link
            href={applyHref}
            className="inline-flex items-center bg-brand text-white rounded-lg px-4 py-2 mt-3 text-sm font-medium shadow-sm hover:bg-brand/90 transition-colors"
          >
            Apply filters
            <ApplyFiltersStatus />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="bg-brand text-white rounded-lg px-4 py-2 mt-3 text-sm font-medium shadow-sm opacity-40 cursor-not-allowed"
          >
            Apply filters
          </button>
        )}
        {appliedCount > 0 && (
          <Link
            href={pathname}
            onClick={() => setPending(baseline)}
            className="mt-3 text-sm font-medium text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
          >
            Clear filters
          </Link>
        )}
        {isDirty && (
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Filters changed - press Apply to search.
          </span>
        )}
      </div>
    </div>
  );
}
