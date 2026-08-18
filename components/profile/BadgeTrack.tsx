import type { Tier, TierProgress } from "@/lib/points";
import { MedalBadge, GemBadge } from "./Badge";

export function BadgeTrack({
  title,
  description,
  tiers,
  value,
  hardSolved,
  progress,
  formatValue,
  variant,
}: {
  title: string;
  description: string;
  tiers: Tier[];
  value: number;
  hardSolved?: number;
  progress: TierProgress;
  formatValue: (v: number) => string;
  variant: "medal" | "gem";
}) {
  const { current, currentIndex, next } = progress;
  const Badge = variant === "gem" ? GemBadge : MedalBadge;

  const pointsPct = next
    ? Math.min(100, Math.max(0, ((value - (current?.threshold ?? 0)) / (next.threshold - (current?.threshold ?? 0))) * 100))
    : 100;
  const hardPct = next?.minHardSolved ? Math.min(100, Math.max(0, ((hardSolved ?? 0) / next.minHardSolved) * 100)) : null;
  const pct = hardPct !== null ? Math.min(pointsPct, hardPct) : pointsPct;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-black/50 dark:text-white/50">{description}</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        {tiers.map((t, i) => (
          <Badge key={t.name} tierName={t.name} achieved={i <= currentIndex} />
        ))}
      </div>

      {next ? (
        <div className="flex flex-col gap-1 max-w-sm">
          <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${variant === "gem" ? "bg-gradient-to-r from-violet-500 to-amber-400" : "bg-brand"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-black/50 dark:text-white/50">
            {formatValue(value)} - next: {next.name} at {formatValue(next.threshold)}
            {next.minHardSolved ? ` and ${next.minHardSolved} Hard solves (${hardSolved ?? 0}/${next.minHardSolved})` : ""}
          </span>
        </div>
      ) : (
        <span className="text-xs font-medium text-green-600 dark:text-green-500">Max tier reached!</span>
      )}
    </div>
  );
}
