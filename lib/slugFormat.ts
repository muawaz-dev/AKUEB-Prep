// Pure slug string/lookup helpers - no Prisma import, so this is safe to
// import from Client Components (see components/question-bank/QuestionBankFilters.tsx,
// which needs classLevelToSlug/slugify to compute where "Apply filters"
// should navigate to). Anything that needs a DB round-trip lives in
// lib/slugs.ts instead, which re-exports everything here.

// Minimum published questions a chapter/past-paper needs before its page is
// linked, indexed, or considered to "exist" at all (see proxy.ts and every
// /question-bank/[classLevel]/[subject]/... page) - keeps a half-populated
// chapter from being crawlable as a near-empty page.
export const MIN_QUESTIONS = 3;

const CLASS_LEVEL_TO_SLUG: Record<number, string> = {
  9: "ssc-i",
  10: "ssc-ii",
  11: "hssc-i",
  12: "hssc-ii",
};
const SLUG_TO_CLASS_LEVEL: Record<string, number> = Object.fromEntries(
  Object.entries(CLASS_LEVEL_TO_SLUG).map(([level, slug]) => [slug, Number(level)])
);

export function classLevelToSlug(level: number): string {
  return CLASS_LEVEL_TO_SLUG[level] ?? `class-${level}`;
}

export function slugToClassLevel(slug: string): number | null {
  return SLUG_TO_CLASS_LEVEL[slug] ?? null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Finds whichever item in `items` slugifies to `slug` - used for Subject,
// Chapter, and past-paper lookups, none of which have a dedicated slug
// column. Fine at the current scale (a handful of subjects, ~11 chapters);
// revisit with a real `slug` column if titles ever collide once slugified.
export function findBySlug<T>(items: T[], slug: string, textOf: (item: T) => string): T | undefined {
  return items.find((item) => slugify(textOf(item)) === slug);
}
