"use client";

import { useEffect } from "react";

// KaTeX renders each equation as one unbreakable box, and globals.css gives
// wide ones their own overflow-x scroller so they don't bleed out of their
// container (see the .katex/.katex-display rules there). That scroller's
// classic, always-visible scrollbar makes "there's more to scroll" obvious
// on Chrome/Edge/Firefox - but iOS Safari always uses its overlay
// scrollbar, hidden until touched, with no CSS able to override that. This
// component is the fallback: it tags every overflowing formula with a data
// attribute, which globals.css turns into a soft edge shadow, so the cue
// is visible immediately on every platform instead of only after a user
// stumbles into scrolling by accident.
export function MathScrollHint() {
  useEffect(() => {
    const SELECTOR = ".katex, .katex-display";
    const withScrollListener = new WeakSet<Element>();

    function updateOne(el: HTMLElement) {
      const scrollable = el.scrollWidth > el.clientWidth + 1;
      el.dataset.scrollable = scrollable ? "true" : "false";
      if (!scrollable || withScrollListener.has(el)) return;

      withScrollListener.add(el);
      const onScroll = () => {
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        el.dataset.atEnd = atEnd ? "true" : "false";
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    let pending = false;
    function scanAll() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        document.querySelectorAll<HTMLElement>(SELECTOR).forEach(updateOne);
      });
    }

    // Marking a node this way while React is still hydrating it (this app
    // streams question content in via Suspense, so that can happen well
    // after this component's own mount) logs a hydration-mismatch warning
    // - React explicitly leaves the attribute in place rather than
    // reverting it ("this won't be patched up"), so it's inert, not a
    // correctness bug, and not worth chasing a "wait until hydration is
    // truly done" signal for: with per-boundary selective hydration there
    // isn't one single point where that's guaranteed true for the whole
    // tree (not even `load`, since a boundary can stay unhydrated until
    // it's scrolled into view or interacted with).
    scanAll();

    // Explanations, revealed choices, etc. mount new .katex nodes well
    // after first paint, and a formula's own overflow can flip (e.g. a
    // sidebar collapsing changes its container width) - both need a
    // rescan, which a one-off scan can't catch.
    const mutationObserver = new MutationObserver(scanAll);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(scanAll);
    resizeObserver.observe(document.body);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return null;
}
