import type { Difficulty, QuestionType } from "@/app/generated/prisma/enums";

// MCQ is worth less than every other type at the same difficulty - picking
// from a handful of options is easier than producing an answer from
// scratch. No length/parts-count multiplier either way, so a question with
// many parts can't outscore a harder single-part one.
export const MCQ_DIFFICULTY_POINTS: Record<Difficulty, number> = {
  EASY: 3,
  MEDIUM: 5,
  HARD: 10,
};
export const OTHER_DIFFICULTY_POINTS: Record<Difficulty, number> = {
  EASY: 8,
  MEDIUM: 15,
  HARD: 20,
};

export function basePoints(type: QuestionType, difficulty: Difficulty): number {
  const table = type === "MCQ" ? MCQ_DIFFICULTY_POINTS : OTHER_DIFFICULTY_POINTS;
  return table[difficulty] ?? table.MEDIUM;
}

// Full points on a first-try correct check; half points if it took one or
// more wrong attempts first. Binary - doesn't decay further with more
// wrong attempts, since retrying-until-correct is the intended philosophy.
// Covers every type except FILL_IN_BLANK, which grades with partial credit
// per blank instead (see fillBlankPoints below).
export function pointsForAttempt(type: QuestionType, difficulty: Difficulty, firstTryCorrect: boolean): number {
  const base = basePoints(type, difficulty);
  return firstTryCorrect ? base : Math.floor(base / 2);
}

// FILL_IN_BLANK: the question's base points are split evenly across its
// blanks. Blanks correct on the very first check ever earn full rate;
// blanks that only became correct on a later check earn half rate (same
// full/half split as pointsForAttempt, applied per blank instead of to the
// whole question). `firstCheckBlankCount` is frozen the moment the
// question's first attempt is recorded, so this stays stable no matter how
// many times it's recomputed as more blanks get topped up.
export function fillBlankPoints(
  difficulty: Difficulty,
  totalBlanks: number,
  firstCheckBlankCount: number,
  correctBlankCount: number
): number {
  if (totalBlanks === 0) return 0;
  const base = basePoints("FILL_IN_BLANK", difficulty);
  const perBlank = base / totalBlanks;
  const laterCorrect = correctBlankCount - firstCheckBlankCount;
  return Math.round(perBlank * firstCheckBlankCount + perBlank * 0.5 * laterCorrect);
}

export type Tier = { name: string; threshold: number; minHardSolved?: number };

// Volume/participation-flavored track: plain medal tiers keyed only off how
// many questions have ever been solved.
export const SOLVED_COUNT_TIERS: Tier[] = [
  { name: "Bronze", threshold: 10 },
  { name: "Silver", threshold: 50 },
  { name: "Gold", threshold: 100 },
  { name: "Platinum", threshold: 250 },
];

// Mastery-flavored track: distinct names from the solved-count track,
// exponential thresholds so the top tier is genuinely rare, and the top two
// tiers additionally require a minimum number of Hard solves so the badge
// can't be gamed by grinding only Easy questions. Thresholds and
// minHardSolved must both stay monotonically non-decreasing down the list -
// tierProgress below assumes it.
export const POINTS_TIERS: Tier[] = [
  { name: "Apprentice", threshold: 100 },
  { name: "Scholar", threshold: 500 },
  { name: "Master", threshold: 2000, minHardSolved: 10 },
  { name: "Grandmaster", threshold: 6000, minHardSolved: 30 },
];

export type TierProgress = { current: Tier | null; currentIndex: number; next: Tier | null };

function meetsTier(tier: Tier, value: number, hardSolved: number): boolean {
  return value >= tier.threshold && (tier.minHardSolved === undefined || hardSolved >= tier.minHardSolved);
}

export function tierProgress(tiers: Tier[], value: number, hardSolved = 0): TierProgress {
  let current: Tier | null = null;
  let currentIndex = -1;
  let next: Tier | null = null;
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (meetsTier(tier, value, hardSolved)) {
      current = tier;
      currentIndex = i;
    } else if (!next) {
      next = tier;
    }
  }
  return { current, currentIndex, next };
}
