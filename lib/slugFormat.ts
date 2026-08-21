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
  9: "class-9",
  10: "class-10",
  11: "class-11",
  12: "class-12",
};
const SLUG_TO_CLASS_LEVEL: Record<string, number> = Object.fromEntries(
  Object.entries(CLASS_LEVEL_TO_SLUG).map(([level, slug]) => [slug, Number(level)])
);

// AKU-EB's own grade names - shown alongside "Class N" (the term people
// actually search for) rather than as the primary label. See
// classLevelToLabel/classLevelToShortLabel below.
const CLASS_LEVEL_TO_LEGACY_CODE: Record<number, string> = {
  9: "SSC-I",
  10: "SSC-II",
  11: "HSSC-I",
  12: "HSSC-II",
};

export function classLevelToSlug(level: number): string {
  return CLASS_LEVEL_TO_SLUG[level] ?? `class-${level}`;
}

export function slugToClassLevel(slug: string): number | null {
  return SLUG_TO_CLASS_LEVEL[slug] ?? null;
}

// "Class 11" - used wherever the AKU-EB legacy code would be redundant or
// clash with a shorter title (e.g. past-paper pages/titles).
export function classLevelToShortLabel(level: number): string {
  return `Class ${level}`;
}

// "Class 11 (HSSC-I)" - the general-purpose display label for class hub,
// subject, and chapter pages (H1s, <title>s, breadcrumbs).
export function classLevelToLabel(level: number): string {
  const legacyCode = CLASS_LEVEL_TO_LEGACY_CODE[level];
  const shortLabel = classLevelToShortLabel(level);
  return legacyCode ? `${shortLabel} (${legacyCode})` : shortLabel;
}

// Past-paper text is free-form (e.g. "AKU-EB Model Paper 2025", "Model Paper
// 2025") - strips a leading board prefix so it can be recombined as
// "Class 11 Physics Model Paper 2025" without repeating "AKU-EB".
export function stripBoardPrefix(pastPaper: string): string {
  return pastPaper.replace(/^aku-?eb\s*/i, "").trim();
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
