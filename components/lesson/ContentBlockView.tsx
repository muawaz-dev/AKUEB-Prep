import type { BlockType, QuestionType } from "@/app/generated/prisma/enums";
import { MarkdownContent } from "./MarkdownContent";
import { QuestionWidget } from "./QuestionWidget";

type BlockContent = {
  text?: string;
  youtubeId?: string;
  caption?: string;
  url?: string;
  alt?: string;
  latex?: string;
  problem?: string;
  solution?: string;
  title?: string;
  questionType?: QuestionType;
  prompt?: string;
  explanation?: string;
  choices?: string[];
  correctIndex?: number;
  answer?: number;
  tolerance?: number;
  acceptedAnswers?: string[];
  statements?: { text: string; isTrue: boolean; explanation?: string }[];
};

export function ContentBlockView({
  blockType,
  content,
}: {
  blockType: BlockType;
  content: BlockContent;
}) {
  switch (blockType) {
    case "TEXT":
      return <MarkdownContent text={content.text ?? ""} />;

    case "VIDEO":
      return (
        <figure className="flex flex-col gap-2">
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full rounded"
              src={`https://www.youtube.com/embed/${content.youtubeId}`}
              title={content.caption ?? "Lesson video"}
              allowFullScreen
            />
          </div>
          {content.caption && (
            <figcaption className="text-sm text-black/60 dark:text-white/60">{content.caption}</figcaption>
          )}
        </figure>
      );

    case "IMAGE":
      return (
        <figure className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URLs, not local optimized assets */}
          <img src={content.url} alt={content.alt ?? ""} className="rounded max-w-full" />
          {content.caption && (
            <figcaption className="text-sm text-black/60 dark:text-white/60">{content.caption}</figcaption>
          )}
        </figure>
      );

    case "FORMULA":
      return (
        <figure className="flex flex-col gap-2">
          <div className="overflow-x-auto py-1">
            <MarkdownContent text={`$$${content.latex ?? ""}$$`} />
          </div>
          {content.caption && (
            <figcaption className="text-sm text-black/60 dark:text-white/60">{content.caption}</figcaption>
          )}
        </figure>
      );

    case "WORKED_EXAMPLE":
      return (
        <div className="border border-black/10 dark:border-white/10 rounded p-4 flex flex-col gap-3">
          <div>
            <div className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1">PROBLEM</div>
            <MarkdownContent text={content.problem ?? ""} />
          </div>
          <div>
            <div className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1">SOLUTION</div>
            <MarkdownContent text={content.solution ?? ""} />
          </div>
        </div>
      );

    case "CALLOUT":
      return (
        <div className="border-l-4 border-black/30 dark:border-white/30 bg-black/5 dark:bg-white/10 rounded-r px-4 py-3">
          {content.title && <div className="font-semibold mb-1">{content.title}</div>}
          <MarkdownContent text={content.text ?? ""} />
        </div>
      );

    case "QUESTION":
      return (
        <QuestionWidget
          type={content.questionType ?? "MCQ"}
          title={content.title}
          prompt={content.prompt ?? ""}
          data={content}
          explanation={content.explanation ?? null}
        />
      );
  }
}
