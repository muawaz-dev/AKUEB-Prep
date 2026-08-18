import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Strips the paragraph wrapper react-markdown normally adds, so this can be
// dropped inline into a <span>/<label>/flex row without introducing block-level
// spacing - used for short strings like MCQ choices or statement text.
// ol/ul get explicit list-style + padding utilities here because inline mode
// has no .prose-content ancestor to inherit that styling from - Tailwind's
// Preflight reset strips list-style/padding on every <ol>/<ul> by default,
// so a numbered list embedded in a prompt or choice would otherwise render
// with no numbers and no indent.
const inlineComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5">{children}</ol>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5">{children}</ul>,
};

// remark-math only treats $$..$$ as a centered display equation when the
// delimiters each sit alone on their own line (like a fenced code block) -
// admin-authored content almost always writes "$$formula$$" on a single
// line instead, which falls through to cramped inline-math rendering. A
// single newline (rather than a full blank-line paragraph break) is enough
// to put each delimiter at the start of its own line - fenced constructs
// like this interrupt a paragraph without needing a blank line first, and
// this preserves a "\" hard-break already written just before the "$$".
function normalizeDisplayMath(text: string): string {
  // A "\" hard-break written just before a $$ block is now redundant - the
  // block boundary below already forces the line break - and since the
  // paragraph ends right there, it has no following line to break into, so
  // it would otherwise render as a stray literal backslash. Drop it first.
  const withoutRedundantBreak = text.replace(/\\[ \t]*\r?\n(?=[ \t]*\$\$)/g, "\n");
  return withoutRedundantBreak.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner: string) => `\n$$\n${inner.trim()}\n$$\n`);
}

// Renders admin-authored Markdown. Supports headings, bold/italic,
// bullet/numbered lists, and inline/block math via $..$ and $$..$$
// (e.g. "$x^2 + 3x + 2$"), so any admin-authored text - lesson prose or
// question prompts/choices/explanations - can mix explanation with formulas.
export function MarkdownContent({ text, inline = false }: { text: string; inline?: boolean }) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={inline ? undefined : "prose-content leading-7"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? inlineComponents : undefined}
      >
        {normalizeDisplayMath(text)}
      </ReactMarkdown>
    </Wrapper>
  );
}
