"use client";

import { useEffect, useRef, useState } from "react";
import { MathfieldElement } from "mathlive";
import katex from "katex";

// This module is only ever loaded client-side (see MathKeyboardInput.tsx's
// next/dynamic(..., { ssr: false }) wrapper), since mathlive's real
// MathfieldElement class needs the DOM and doesn't exist in the SSR build.
//
// We ship math fonts via mathlive/static.css (see app/globals.css); disable
// MathLive's own dynamic font loading so it doesn't also fetch from a
// "/fonts" path relative to the page that won't exist.
MathfieldElement.fontsDirectory = null;

// Buttons insert LaTeX fragments at the cursor via the mathfield's own
// `insert()` API, which understands `#0`/`#1` as placeholders and moves the
// selection into the first one - so e.g. clicking √ drops the cursor inside
// the radical automatically, no manual cursor-offset tracking needed.
// `display` is separate from `insert` because it's typeset as a standalone,
// placeholder-free preview (e.g. showing `\sqrt{x}` for a key that actually
// inserts `\sqrt{#0}`) via the same KaTeX renderer used for lesson content,
// so every button reads as real math instead of a plain-text approximation.
const KEY_BUTTONS: { display: string; insert: string }[] = [
  { display: "x^2", insert: "^2" },
  { display: "x^n", insert: "^{#0}" },
  { display: "\\sqrt{x}", insert: "\\sqrt{#0}" },
  { display: "\\sqrt[n]{x}", insert: "\\sqrt[#0]{#1}" },
  { display: "\\frac{a}{b}", insert: "\\frac{#0}{#1}" },
  { display: "\\pi", insert: "\\pi" },
  { display: "i", insert: "i" },
  { display: "7", insert: "7" },
  { display: "8", insert: "8" },
  { display: "9", insert: "9" },
  { display: "(", insert: "(" },
  { display: ")", insert: ")" },
  { display: "\\times", insert: "\\times" },
  { display: "4", insert: "4" },
  { display: "5", insert: "5" },
  { display: "6", insert: "6" },
  { display: "x", insert: "x" },
  { display: "=", insert: "=" },
  { display: "\\div", insert: "\\div" },
  { display: "1", insert: "1" },
  { display: "2", insert: "2" },
  { display: "3", insert: "3" },
  { display: "+", insert: "+" },
  { display: "-", insert: "-" },
  { display: ".", insert: "." },
  { display: "0", insert: "0" },
];

function renderKeyMarkup(latex: string): string {
  return katex.renderToString(latex, { throwOnError: false, output: "html" });
}

// A WYSIWYG math input backed by MathLive's <math-field>: it always shows
// typeset math (never raw LaTeX source), and Backspace deletes structurally
// (a whole \sqrt{} or \frac{}{} in one press when the cursor sits at its
// edge, not just one character), matching how a real math editor behaves.
// Paired with a toggle-able button panel that inserts LaTeX via the same
// mechanism a keyboard shortcut would. `value`/`onChange` carry plain LaTeX
// (no $ delimiters), same convention as the rest of this app.
export function MathKeyboardInput({
  name,
  value,
  onChange,
  placeholder,
  className,
  inputBoxClassName,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputBoxClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fieldContainerRef = useRef<HTMLDivElement>(null);
  const mathfieldRef = useRef<MathfieldElement | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // The mathfield is an uncontrolled DOM node (mounted once) rather than a
  // React-rendered element, since MathLive owns its own internal editing
  // state/cursor that React's virtual DOM has no model for.
  useEffect(() => {
    const container = fieldContainerRef.current;
    if (!container) return;
    const mf = new MathfieldElement({ mathVirtualKeyboardPolicy: "manual", defaultMode: "math" });
    mf.value = value;
    mf.className = "flex-1 min-w-0 text-sm px-3 py-1.5";
    if (placeholder) mf.setAttribute("placeholder", placeholder);
    const handleInput = () => onChangeRef.current(mf.value);
    mf.addEventListener("input", handleInput);
    container.appendChild(mf);
    mathfieldRef.current = mf;
    return () => {
      mf.removeEventListener("input", handleInput);
      container.removeChild(mf);
      mathfieldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the mathfield in sync if `value` changes from outside (e.g. a
  // parent resetting the form) without fighting the user's own typing,
  // which already flows out through onChange above.
  useEffect(() => {
    const mf = mathfieldRef.current;
    if (mf && mf.value !== value) mf.value = value;
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function insert(latex: string) {
    mathfieldRef.current?.insert(latex, { focus: true });
  }
  function backspace() {
    mathfieldRef.current?.executeCommand("deleteBackward");
    mathfieldRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className ?? ""}`}>
      <div
        className={`flex items-stretch rounded border overflow-hidden ${inputBoxClassName ?? "border-black/20 dark:border-white/20"}`}
      >
        <div ref={fieldContainerRef} className="flex-1 min-w-0 flex items-center" />
        {name && <input type="hidden" name={name} value={value} readOnly />}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Open math keyboard"
          className={`px-3 text-sm border-l border-black/20 dark:border-white/20 ${
            open ? "bg-black/10 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          √x
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-max grid grid-cols-6 gap-1 border border-black/20 dark:border-white/20 rounded p-2 bg-white dark:bg-black shadow-lg">
          {KEY_BUTTONS.map((key) => (
            <button
              key={key.display}
              type="button"
              onClick={() => insert(key.insert)}
              className="rounded border border-black/10 dark:border-white/10 py-1.5 px-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              dangerouslySetInnerHTML={{ __html: renderKeyMarkup(key.display) }}
            />
          ))}
          <button
            type="button"
            onClick={backspace}
            className="col-span-2 rounded border border-black/10 dark:border-white/10 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            ⌫ Delete
          </button>
        </div>
      )}
    </div>
  );
}
