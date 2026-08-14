import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Strips the paragraph wrapper react-markdown normally adds, so this can be
// dropped inline into a <span>/<label>/flex row without introducing block-level
// spacing - used for short strings like MCQ choices or statement text.
const inlineComponents = { p: ({ children }: { children?: React.ReactNode }) => <>{children}</> };

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
        {text}
      </ReactMarkdown>
    </Wrapper>
  );
}
