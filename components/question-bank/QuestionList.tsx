"use client";

import { useEffect, useRef, useState } from "react";
import { QuestionWidget } from "@/components/lesson/QuestionWidget";
import { Spinner } from "@/components/Spinner";
import type { QuestionDTO } from "@/lib/questionDto";
import type { Difficulty } from "@/app/generated/prisma/enums";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  EASY: "border-green-600 text-green-700 dark:text-green-500",
  MEDIUM: "border-amber-600 text-amber-700 dark:text-amber-500",
  HARD: "border-red-600 text-red-700 dark:text-red-500",
};

// The solved-badge slot for one question - unresolved (spinner) until this
// question's id shows up in `resolvedIds`, then either the checkmark or
// nothing. Never blocks the question itself from rendering/being answered.
function SolvedBadge({ resolved, solved }: { resolved: boolean; solved: boolean }) {
  if (!resolved) return <Spinner />;
  if (!solved) return null;
  return (
    <span className="text-xs font-medium rounded px-2 py-0.5 border border-green-600 text-green-700 dark:text-green-500">
      Solved
    </span>
  );
}

// Renders a question list that starts from a server-rendered first page
// (so first paint needs no client round-trip and stays cacheable - see the
// pages under app/(main)/question-bank/) and takes over from there:
// infinite-scroll pagination in batches of 15, plus per-user "Solved"
// status resolved client-side via /api/solved-status and /api/questions,
// so the page itself never has to call getCurrentUser().
export function QuestionList({
  initialQuestions,
  initialHasMore,
  queryString,
}: {
  initialQuestions: QuestionDTO[];
  initialHasMore: boolean;
  queryString: string;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Resolve solved-status for the initial, server-rendered batch - these
  // never go through /api/questions, so nothing else would ever fetch it.
  useEffect(() => {
    const ids = initialQuestions.map((q) => q.id);
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/solved-status?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data: { solvedIds: string[] }) => {
        if (cancelled) return;
        setSolvedIds((prev) => new Set([...prev, ...data.solvedIds]));
        setResolvedIds((prev) => new Set([...prev, ...ids]));
      })
      .catch(() => {
        if (!cancelled) setResolvedIds((prev) => new Set([...prev, ...ids]));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/questions?${queryString}&offset=${questions.length}&take=15`);
      const data: { questions: QuestionDTO[]; hasMore: boolean; solvedIds: string[] } = await res.json();
      setQuestions((prev) => [...prev, ...data.questions]);
      setSolvedIds((prev) => new Set([...prev, ...data.solvedIds]));
      setResolvedIds((prev) => new Set([...prev, ...data.questions.map((q) => q.id)]));
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, questions.length]);

  return (
    <div className="flex flex-col gap-8">
      {questions.map((q, i) => (
        <div key={q.id} className={i < questions.length - 1 ? "pb-8 border-b-2 border-black/10 dark:border-white/10" : ""}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
              {q.breadcrumb}
            </span>
            <div className="flex items-center gap-2">
              {q.pastPaper && (
                <span className="text-xs font-medium rounded px-2 py-0.5 border border-black/20 dark:border-white/20 text-black/60 dark:text-white/60">
                  {q.pastPaper}
                </span>
              )}
              <span className={`text-xs font-medium rounded px-2 py-0.5 border ${DIFFICULTY_STYLES[q.difficulty]}`}>
                {q.difficulty}
              </span>
              <SolvedBadge resolved={resolvedIds.has(q.id)} solved={solvedIds.has(q.id)} />
            </div>
          </div>
          <QuestionWidget
            type={q.type}
            title={`Q${i + 1}`}
            imageUrl={q.imageUrl ?? undefined}
            imageAlt={q.imageAlt ?? undefined}
            prompt={q.prompt}
            data={q.data}
            explanation={q.explanation}
            questionId={q.id}
          />
        </div>
      ))}

      {questions.length === 0 && (
        <p className="text-base text-black/40 dark:text-white/40">No questions match these filters yet.</p>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loadingMore && <Spinner />}
        </div>
      )}
    </div>
  );
}
