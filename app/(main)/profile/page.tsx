import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SOLVED_COUNT_TIERS, POINTS_TIERS, tierProgress } from "@/lib/points";
import { BadgeTrack } from "@/components/profile/BadgeTrack";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto w-full p-8">
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

  const solved = await prisma.solvedQuestion.findMany({
    where: { userId: user.id },
    select: { pointsAwarded: true, question: { select: { difficulty: true } } },
  });

  const totalPoints = solved.reduce((sum, s) => sum + s.pointsAwarded, 0);
  const solvedCount = solved.length;
  const hardSolved = solved.filter((s) => s.question.difficulty === "HARD").length;

  const solvedProgress = tierProgress(SOLVED_COUNT_TIERS, solvedCount);
  const pointsProgress = tierProgress(POINTS_TIERS, totalPoints, hardSolved);

  return (
    <div className="max-w-3xl mx-auto w-full p-8 flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-base text-black/60 dark:text-white/60 mt-1">{user.name ?? user.email}</p>
      </div>

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
        hardSolved={hardSolved}
        progress={pointsProgress}
        formatValue={(v) => `${v} pts`}
        variant="gem"
      />
    </div>
  );
}
