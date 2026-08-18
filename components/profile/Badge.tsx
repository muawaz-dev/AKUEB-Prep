const MEDAL_GRADIENTS: Record<string, string> = {
  Bronze: "from-amber-700 to-amber-500",
  Silver: "from-slate-400 to-slate-200",
  Gold: "from-yellow-500 to-yellow-300",
  Platinum: "from-cyan-300 to-slate-100",
};

// Plain medal-style badge for the solved-count (volume/participation) track.
export function MedalBadge({ tierName, achieved }: { tierName: string; achieved: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 w-16 ${achieved ? "" : "opacity-30 grayscale"}`}>
      <div
        className={`h-14 w-14 rounded-full bg-gradient-to-br ${MEDAL_GRADIENTS[tierName] ?? MEDAL_GRADIENTS.Bronze} shadow-md flex items-center justify-center border-2 border-white/60 dark:border-black/30`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M12 2l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L12 2Z" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-xs font-medium text-center">{tierName}</span>
    </div>
  );
}

const GEM_GRADIENTS: Record<string, string> = {
  Apprentice: "from-slate-400 to-slate-200",
  Scholar: "from-sky-500 to-blue-300",
  Master: "from-violet-600 to-fuchsia-400",
  Grandmaster: "from-amber-300 via-yellow-100 to-amber-400",
};

// Richer, premium-feeling gem/crystal badge for the points (mastery) track -
// a rotated square with a gold-foil shimmer sweep when achieved.
export function GemBadge({ tierName, achieved }: { tierName: string; achieved: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 w-16 ${achieved ? "" : "opacity-30 grayscale"}`}>
      <div className="h-14 w-14 flex items-center justify-center">
        <div
          className={`relative h-10 w-10 rotate-45 rounded-md bg-gradient-to-br ${GEM_GRADIENTS[tierName] ?? GEM_GRADIENTS.Apprentice} shadow-lg border border-white/60 overflow-hidden`}
        >
          {achieved && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-tr from-transparent via-white/80 to-transparent" />
          )}
        </div>
      </div>
      <span className="text-xs font-semibold text-center">{tierName}</span>
    </div>
  );
}
