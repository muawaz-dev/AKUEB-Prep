import type { Difficulty } from "@/app/generated/prisma/enums";

// Purely difficulty-based - no length/parts-count multiplier, so an Easy
// question with many parts can't outscore a Hard single-part question.
export const DIFFICULTY_POINTS: Record<Difficulty, number> = {
  EASY: 10,
  MEDIUM: 25,
  HARD: 50,
};

// Full points on a first-try correct check; half points if it took one or
// more wrong attempts first. Binary - doesn't decay further with more
// wrong attempts, since retrying-until-correct is the intended philosophy.
export function pointsForAttempt(difficulty: Difficulty, firstTryCorrect: boolean): number {
  const base = DIFFICULTY_POINTS[difficulty] ?? DIFFICULTY_POINTS.MEDIUM;
  return firstTryCorrect ? base : Math.floor(base / 2);
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
