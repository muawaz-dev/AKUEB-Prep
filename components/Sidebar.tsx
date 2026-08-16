"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoursesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M12 6.5c-1.5-1.3-3.6-2-6.5-2-.6 0-1 .4-1 1v11.5c0 .6.4 1 1 1 2.9 0 5 .7 6.5 2 1.5-1.3 3.6-2 6.5-2 .6 0 1-.4 1-1V5.5c0-.6-.4-1-1-1-2.9 0-5 .7-6.5 2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.5v13" strokeLinecap="round" />
    </svg>
  );
}

function QuestionBankIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.8-3.8 4-6 7.5-6s6.7 2.2 7.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" strokeLinecap="round" />
      <path d="M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M14.5 9.5 12 12l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/courses", label: "Courses", Icon: CoursesIcon },
  { href: "/question-bank", label: "Question Bank", Icon: QuestionBankIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
  { href: "/about", label: "About", Icon: AboutIcon },
];

export function isTabActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const tabClass =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-300 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.12),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.04)] hover:text-gray-900 dark:hover:text-white";

// Each tab reads as carved into the gray sidebar surface (inset shadow) when
// inactive, and pops back out in the brand color (regular drop shadow) when
// selected - a soft-UI / neumorphic look, distinct from the rest of the
// app's flat black/white styling by design.
//
// <aside> itself is the sticky element AND the thing whose width animates -
// deliberately not split into an outer overflow-hidden wrapper around a
// sticky child, since an overflow-hidden *ancestor* is exactly what breaks
// position: sticky (an element's own overflow doesn't affect its own
// stickiness, only its ancestors' does). The inner div keeps a fixed w-60 so
// its contents don't reflow/wrap as <aside>'s width animates down to 0.
export function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={`shrink-0 hidden lg:block sticky top-14 h-[calc(100dvh-3.5rem)] overflow-hidden transition-[width] duration-300 ease-in-out ${
        collapsed ? "w-0" : "w-60"
      }`}
    >
      <div className="w-60 h-full flex flex-col gap-3 p-4 bg-gray-100 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 overflow-y-auto">
        {TABS.map(({ href, label, Icon }) => {
          const active = isTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                active ? "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium bg-brand text-white shadow-[3px_3px_8px_rgba(0,0,0,0.25)]" : tabClass
              }
            >
              <Icon />
              {label}
            </Link>
          );
        })}

        <div className="mt-2 pt-3 border-t border-gray-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onCollapse}
            className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white w-full"
          >
            <CollapseIcon />
            Collapse
          </button>
        </div>
      </div>
    </aside>
  );
}
