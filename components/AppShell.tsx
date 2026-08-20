"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, TABS, isTabActive } from "./Sidebar";

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 6 15 12l-5.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
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

// Owns the sidebar's collapsed/expanded state so the "Collapse" button
// (inside Sidebar) and the small handle that brings it back (rendered here,
// outside the part of the DOM that disappears when collapsed) share it.
//
// Below lg, Sidebar itself is hidden entirely (no room for a permanent rail),
// so this also owns a mobile nav that drops down from under the header
// instead - same TABS list, opened via a hamburger button.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="lg:hidden sticky top-18 z-10 bg-white dark:bg-black border-b border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-black/70 dark:text-white/70"
        >
          {mobileNavOpen ? <CloseIcon /> : <HamburgerIcon />}
          Menu
        </button>
        <nav
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            mobileNavOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-1 px-4 pb-4">
            {TABS.map(({ href, label, Icon }) => {
              const active = isTabActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium ${
                    active
                      ? "bg-brand text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="flex-1 flex min-h-0">
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(true)} />
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Show sidebar"
            className="hidden lg:flex shrink-0 items-center justify-center w-5 sticky top-14 h-[calc(100dvh-3.5rem)] border-r border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 text-gray-400 hover:text-brand dark:hover:text-white"
          >
            <ExpandIcon />
          </button>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
