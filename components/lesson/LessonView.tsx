"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import type { BlockType, ProgressStatus } from "@/app/generated/prisma/enums";
import { ContentBlockView } from "./ContentBlockView";
import { MarkdownContent } from "./MarkdownContent";
import { setSloProgress } from "@/app/progress/actions";

type SloData = {
  id: string;
  code: string;
  sloText: string;
  cognitiveLevel: string;
  contentBlocks: { id: string; blockType: BlockType; content: Record<string, unknown> }[];
};

type SiblingTopic = { id: string; code: string; title: string };

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M9.5 6 15 12l-5.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function LessonView({
  courseSlug,
  breadcrumb,
  topicCode,
  topicTitle,
  slos,
  prevTopic,
  nextTopic,
  isLoggedIn,
  initialProgress,
}: {
  courseSlug: string;
  breadcrumb: React.ReactNode;
  topicCode: string;
  topicTitle: string;
  slos: SloData[];
  prevTopic: SiblingTopic | null;
  nextTopic: SiblingTopic | null;
  isLoggedIn: boolean;
  initialProgress: Record<string, ProgressStatus>;
}) {
  const [selectedId, setSelectedId] = useState(slos[0]?.id);
  const [progress, setProgress] = useState(initialProgress);
  const [sloNavOpen, setSloNavOpen] = useState(false);
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
    <div className="flex h-[calc(100dvh-6.25rem)] lg:h-[calc(100dvh-3.5rem)] relative">
      {sloNavOpen && (
        <div
          onClick={() => setSloNavOpen(false)}
          aria-hidden="true"
          className="lg:hidden fixed inset-x-0 top-[6.25rem] h-[calc(100dvh-6.25rem)] bg-black/40 z-20"
        />
      )}

      <aside
        className={`w-80 shrink-0 border-r border-black/10 dark:border-white/10 flex flex-col bg-white dark:bg-black
          fixed top-[6.25rem] left-0 h-[calc(100dvh-6.25rem)] z-30 transition-transform duration-300 ease-in-out
          ${sloNavOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto lg:h-auto`}
      >
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
              {breadcrumb}
            </div>
            <button
              type="button"
              onClick={() => setSloNavOpen(false)}
              aria-label="Close lessons list"
              className="lg:hidden text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            >
              <CloseIcon />
            </button>
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
            <div className="font-semibold text-base flex-1">
              <MarkdownContent text={topicTitle} inline />
            </div>
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
            return (
              <li key={slo.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(slo.id);
                    setSloNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-l-2 ${
                    isSelected
                      ? "border-black dark:border-white bg-black/5 dark:bg-white/10"
                      : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="text-base text-black/80 dark:text-white/80 shrink-0">{slo.code}</span>
                  <span className="flex-1 flex justify-center">
                    <span className="w-8 border-t border-black/10 dark:border-white/10" />
                  </span>
                  <span className="text-xs font-medium text-black/45 dark:text-white/45 uppercase tracking-wide shrink-0">
                    {slo.cognitiveLevel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        {!sloNavOpen && (
          <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-3">
            <button
              type="button"
              onClick={() => setSloNavOpen(true)}
              aria-label="Show lessons list"
              className="text-black/70 dark:text-white/70"
            >
              <ArrowIcon />
            </button>
            <span className="text-sm font-medium truncate">Topic {topicCode}: Select Sub-Topic</span>
          </div>
        )}

        <div className="max-w-4xl mx-auto w-full p-8 flex flex-col gap-6">
          {selected ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-3xl font-semibold">SLO {selected.code}</h1>
                  <p className="text-lg text-black/70 dark:text-white/70 mt-2">
                    <MarkdownContent text={selected.sloText} inline />
                  </p>
                </div>
                {isLoggedIn ? (
                  <span
                    className={`self-start shrink-0 text-sm font-medium rounded px-3 py-1.5 border ${
                      progress[selected.id] === "COMPLETED"
                        ? "border-green-600 text-green-600 dark:text-green-500"
                        : "border-black/20 dark:border-white/20 text-black/60 dark:text-white/60"
                    }`}
                  >
                    {progress[selected.id] === "COMPLETED" ? "Completed" : "Not Completed"}
                  </span>
                ) : (
                  <Link
                    href="/login"
                    className="self-start shrink-0 text-sm text-black/50 dark:text-white/50 hover:underline"
                  >
                    Log in to track progress
                  </Link>
                )}
              </div>

              <div className="flex flex-col">
                {selected.contentBlocks.map((block, i) => (
                  <div
                    key={block.id}
                    className={
                      i < selected.contentBlocks.length - 1
                        ? "pb-8 mb-8 border-b-2 border-black/10 dark:border-white/10"
                        : ""
                    }
                  >
                    <ContentBlockView blockType={block.blockType} content={block.content} />
                  </div>
                ))}
                {selected.contentBlocks.length === 0 && (
                  <p className="text-base text-black/40 dark:text-white/40">No content yet for this SLO.</p>
                )}
              </div>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={toggleComplete}
                  disabled={isPending}
                  className={`w-fit text-base font-medium rounded px-4 py-2 border disabled:opacity-50 ${
                    progress[selected.id] === "COMPLETED"
                      ? "border-green-600 text-green-600 dark:text-green-500 hover:bg-green-600/10"
                      : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                  }`}
                >
                  {progress[selected.id] === "COMPLETED" ? "Mark as incomplete" : "Mark as complete"}
                </button>
              )}
            </>
          ) : (
            <p className="text-base text-black/50 dark:text-white/50">No content published for this lesson yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
