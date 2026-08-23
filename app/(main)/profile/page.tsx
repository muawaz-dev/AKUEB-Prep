import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SOLVED_COUNT_TIERS, POINTS_TIERS, tierProgress } from "@/lib/points";
import { BadgeTrack } from "@/components/profile/BadgeTrack";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SubjectOverview } from "@/components/profile/SubjectOverview";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto w-full p-8">
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-base text-black/50 dark:text-white/50 mt-2">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to track your points, solved questions, and badges.
        </p>
      </div>
    );
  }

  const [totals, solvedCount, hardSolvedCount, firstTryCount, classes, subjects] = await Promise.all([
    prisma.questionAttempt.aggregate({ where: { userId: user.id }, _count: { _all: true }, _sum: { pointsAwarded: true } }),
    prisma.questionAttempt.count({ where: { userId: user.id, solved: true } }),
    prisma.questionAttempt.count({ where: { userId: user.id, solved: true, question: { difficulty: "HARD" } } }),
    prisma.questionAttempt.count({ where: { userId: user.id, firstTryCorrect: true } }),
    prisma.class.findMany({ orderBy: { level: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  const attemptedCount = totals._count._all;
  // Sums ALL attempts, not just solved ones - a partially-solved
  // FILL_IN_BLANK row can carry real banked points before being fully solved.
  const totalPoints = totals._sum.pointsAwarded ?? 0;

  const solvedProgress = tierProgress(SOLVED_COUNT_TIERS, solvedCount);
  const pointsProgress = tierProgress(POINTS_TIERS, totalPoints, hardSolvedCount);

  return (
    <div className="max-w-3xl mx-auto w-full p-8 flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-base text-black/60 dark:text-white/60 mt-1">{user.name ?? user.email}</p>
      </div>

      <ProfileEditForm initialName={user.name ?? ""} initialClassId={user.classId} classes={classes} />

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-black/10 dark:border-white/10 p-5">
          <div className="text-sm text-black/50 dark:text-white/50">Total points</div>
          <div className="text-3xl font-semibold mt-1">{totalPoints}</div>
        </div>
        <div className="flex-1 rounded-xl border border-black/10 dark:border-white/10 p-5">
          <div className="text-sm text-black/50 dark:text-white/50">Questions solved</div>
          <div className="text-3xl font-semibold mt-1">{solvedCount}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 rounded-xl border border-black/10 dark:border-white/10 p-5">
            <div className="text-sm text-black/50 dark:text-white/50">Questions attempted</div>
            <div className="text-3xl font-semibold mt-1">{attemptedCount}</div>
          </div>
          <div className="flex-1 rounded-xl border border-black/10 dark:border-white/10 p-5">
            <div className="text-sm text-black/50 dark:text-white/50">Solved on first attempt</div>
            <div className="text-3xl font-semibold mt-1">{firstTryCount}</div>
            {attemptedCount > 0 && (
              <div className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                {Math.round((firstTryCount / attemptedCount) * 100)}% of attempted
              </div>
            )}
          </div>
        </div>

        <SubjectOverview subjects={subjects} hasClass={user.classId !== null} />
      </div>

      <BadgeTrack
        title="Solved badges"
        description="Awarded for the number of questions you've ever solved."
        tiers={SOLVED_COUNT_TIERS}
        value={solvedCount}
        progress={solvedProgress}
        formatValue={(v) => `${v} solved`}
        variant="medal"
      />

      <BadgeTrack
        title="Mastery badges"
        description="Awarded for total points earned - the top tiers also require a minimum number of Hard questions solved, so they can't be reached by grinding Easy questions alone."
        tiers={POINTS_TIERS}
        value={totalPoints}
        hardSolved={hardSolvedCount}
        progress={pointsProgress}
        formatValue={(v) => `${v} pts`}
        variant="gem"
      />
    </div>
  );
}
