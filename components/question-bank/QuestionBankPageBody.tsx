import Link from "next/link";
import { QuestionBankFilters, type InitialFilters } from "./QuestionBankFilters";
import { QuestionList } from "./QuestionList";
import type { FilterClass } from "@/lib/questionBankFilterTree";
import type { QuestionDTO } from "@/lib/questionDto";

type PastPaperRow = {
  pastPaper: string;
  classId: string;
  subjectId: string;
  chapterId: string | null;
  topicId: string | null;
  sloId: string | null;
};

// Shared by app/(main)/question-bank/page.tsx and every
// app/(main)/question-bank/[classLevel]/[subject]/... page - one visual
// design for browsing/practicing questions, whether you arrive at the plain
// explorer or a pre-filtered URL. `locked` fixes whichever fields the URL
// already implies (see QuestionBankFilters); `queryString` (built from
// exactly those fixed fields plus any extra query-param filters) is what
// QuestionList's "load more" requests replay against /api/questions.
export function QuestionBankPageBody({
  title,
  description,
  backHref,
  backLabel,
  classes,
  pastPaperRows,
  initial,
  initialQuestions,
  initialHasMore,
  queryString,
  jsonLd,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  classes: FilterClass[];
  pastPaperRows: PastPaperRow[];
  initial?: InitialFilters;
  initialQuestions: QuestionDTO[];
  initialHasMore: boolean;
  queryString: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}) {
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <div className="max-w-6xl mx-auto w-full p-8 flex flex-col gap-6">
      <div>
        {backHref && (
          <Link href={backHref} className="text-base text-black/50 dark:text-white/50 hover:underline">
            &larr; {backLabel}
          </Link>
        )}
        <h1 className="text-3xl font-semibold mt-1">{title}</h1>
        <p className="text-base text-black/50 dark:text-white/50 mt-2">{description}</p>
      </div>

      <QuestionBankFilters classes={classes} pastPaperRows={pastPaperRows} initial={initial} />

      <QuestionList key={queryString} initialQuestions={initialQuestions} initialHasMore={initialHasMore} queryString={queryString} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}
    </div>
  );
}
