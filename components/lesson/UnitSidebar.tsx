"use client";

import { useState } from "react";
import Link from "next/link";
import { MarkdownContent } from "./MarkdownContent";

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

type Topic = { id: string; code: string; title: string };

// Mirrors LessonView's SLO sidebar: a permanent side-by-side rail at lg+,
// collapsed to a hamburger-triggered drawer that overlays the content
// (instead of pushing it aside) below lg.
export function UnitSidebar({
  courseSlug,
  courseTitle,
  chapterId,
  chapterTitle,
  chapterOrderIndex,
  topics,
  children,
}: {
  courseSlug: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterOrderIndex: number;
  topics: Topic[];
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-6.25rem)] lg:h-[calc(100dvh-3.5rem)] relative">
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
          className="lg:hidden fixed inset-x-0 top-[6.25rem] h-[calc(100dvh-6.25rem)] bg-black/40 z-20"
        />
      )}

      <aside
        className={`w-64 shrink-0 border-r border-black/10 dark:border-white/10 flex flex-col bg-white dark:bg-black
          fixed top-[6.25rem] left-0 h-[calc(100dvh-6.25rem)] z-30 transition-transform duration-300 ease-in-out
          ${navOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:z-auto lg:h-auto`}
      >
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/courses/${courseSlug}`}
              className="text-sm font-medium text-black/50 dark:text-white/50 uppercase tracking-wide hover:text-black dark:hover:text-white"
            >
              &larr; {courseTitle}
            </Link>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Close lessons list"
              className="lg:hidden text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="text-lg font-semibold mt-1">
            Unit {chapterOrderIndex} - <MarkdownContent text={chapterTitle} inline />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <Link
            href={`/courses/${courseSlug}/units/${chapterId}`}
            onClick={() => setNavOpen(false)}
            className="flex flex-col px-4 py-2 border-l-2 border-brand dark:border-blue-400 bg-black/5 dark:bg-white/5"
          >
            <span className="text-base text-black/80 dark:text-white/80">Intro</span>
          </Link>
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/courses/${courseSlug}/lessons/${topic.id}`}
              onClick={() => setNavOpen(false)}
              className="flex flex-col px-4 py-2 border-l-2 border-transparent hover:border-brand dark:hover:border-blue-400 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="text-xs font-medium text-black/45 dark:text-white/45 uppercase tracking-wide">
                {topic.code}
              </span>
              <span className="text-base text-black/80 dark:text-white/80">
                <MarkdownContent text={topic.title} inline />
              </span>
            </Link>
          ))}
          {topics.length === 0 && (
            <p className="text-base text-black/40 dark:text-white/40 px-4 py-2">No lessons yet.</p>
          )}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        {!navOpen && (
          <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 border-b border-black/10 dark:border-white/10 bg-white dark:bg-black px-4 py-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Show lessons list"
              className="text-black/70 dark:text-white/70"
            >
              <ArrowIcon />
            </button>
            <span className="text-sm font-medium truncate">Unit-{chapterOrderIndex}: Select Topic</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
