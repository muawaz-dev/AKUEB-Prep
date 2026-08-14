"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import type { BlockType, ProgressStatus } from "@/app/generated/prisma/enums";
import { ContentBlockView } from "./ContentBlockView";
import { setSloProgress } from "@/app/progress/actions";

type SloData = {
  id: string;
  code: string;
  sloText: string;
  contentBlocks: { id: string; blockType: BlockType; content: Record<string, unknown> }[];
};

type SiblingTopic = { id: string; code: string; title: string };

function sloIcon(slo: SloData) {
  const hasVideo = slo.contentBlocks.some((b) => b.blockType === "VIDEO");
  const isPracticeOnly =
    slo.contentBlocks.length > 0 && slo.contentBlocks.every((b) => b.blockType === "QUESTION");

  if (isPracticeOnly) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }
  if (hasVideo) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function CheckBadge() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-green-600 dark:text-green-500 shrink-0"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LessonView({
  courseSlug,
  breadcrumb,
  topicTitle,
  slos,
  prevTopic,
  nextTopic,
  isLoggedIn,
  initialProgress,
}: {
  courseSlug: string;
  breadcrumb: React.ReactNode;
  topicTitle: string;
  slos: SloData[];
  prevTopic: SiblingTopic | null;
  nextTopic: SiblingTopic | null;
  isLoggedIn: boolean;
  initialProgress: Record<string, ProgressStatus>;
}) {
  const [selectedId, setSelectedId] = useState(slos[0]?.id);
  const [progress, setProgress] = useState(initialProgress);
  const [isPending, startTransition] = useTransition();
  const selected = slos.find((s) => s.id === selectedId) ?? slos[0];

  // Mark the currently viewed SLO as in-progress the first time it's opened.
  useEffect(() => {
    if (!isLoggedIn || !selected) return;
    const current = progress[selected.id] ?? "NOT_STARTED";
    if (current !== "NOT_STARTED") return;

    const sloId = selected.id;
    startTransition(async () => {
      const res = await setSloProgress(sloId, "IN_PROGRESS");
      if (res.ok) setProgress((p) => ({ ...p, [sloId]: "IN_PROGRESS" }));
    });
    // Only re-run when the selected SLO changes, not on every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, isLoggedIn]);

  function toggleComplete() {
    if (!selected) return;
    const sloId = selected.id;
    const next: ProgressStatus = progress[sloId] === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    startTransition(async () => {
      const res = await setSloProgress(sloId, next);
      if (res.ok) setProgress((p) => ({ ...p, [sloId]: next }));
    });
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-80 shrink-0 border-r border-black/10 dark:border-white/10 flex flex-col">
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
            {breadcrumb}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            {prevTopic ? (
              <Link
                href={`/courses/${courseSlug}/lessons/${prevTopic.id}`}
                className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                aria-label="Previous lesson"
              >
                &larr;
              </Link>
            ) : (
              <span />
            )}
            <div className="font-semibold text-sm flex-1">{topicTitle}</div>
            {nextTopic ? (
              <Link
                href={`/courses/${courseSlug}/lessons/${nextTopic.id}`}
                className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                aria-label="Next lesson"
              >
                &rarr;
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {slos.map((slo) => {
            const isSelected = slo.id === selected?.id;
            const isCompleted = progress[slo.id] === "COMPLETED";
            return (
              <li key={slo.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(slo.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm border-l-2 ${
                    isSelected
                      ? "border-black dark:border-white bg-black/5 dark:bg-white/10 font-medium"
                      : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="shrink-0">{sloIcon(slo)}</span>
                  <span className="truncate flex-1">{slo.sloText}</span>
                  {isCompleted && <CheckBadge />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full p-8 flex flex-col gap-6">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-black/40 dark:text-white/40">{selected.code}</div>
                  <h1 className="text-xl font-semibold">{selected.sloText}</h1>
                </div>
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={toggleComplete}
                    disabled={isPending}
                    className={`shrink-0 text-xs font-medium rounded px-3 py-1.5 border disabled:opacity-50 ${
                      progress[selected.id] === "COMPLETED"
                        ? "border-green-600 text-green-600 dark:text-green-500"
                        : "border-black/20 dark:border-white/20 text-black/60 dark:text-white/60 hover:border-black dark:hover:border-white"
                    }`}
                  >
                    {progress[selected.id] === "COMPLETED" ? "Completed" : "Mark as complete"}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="shrink-0 text-xs text-black/50 dark:text-white/50 hover:underline"
                  >
                    Log in to track progress
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {selected.contentBlocks.map((block) => (
                  <ContentBlockView key={block.id} blockType={block.blockType} content={block.content} />
                ))}
                {selected.contentBlocks.length === 0 && (
                  <p className="text-sm text-black/40 dark:text-white/40">No content yet for this SLO.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-black/50 dark:text-white/50">No content published for this lesson yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
