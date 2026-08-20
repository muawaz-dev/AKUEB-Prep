import { Skeleton } from "@/components/Skeleton";

// The real page nests everything (including the unit sidebar) inside one
// data fetch, so there's no sidebar content to show yet either - approximate
// its width/border here anyway so the real layout doesn't shift in once it
// loads (see streaming docs on matching skeleton dimensions to avoid CLS).
export default function Loading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <div className="w-64 shrink-0 border-r border-black/10 dark:border-white/10 p-4 flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-40 mt-1" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
        <Skeleton className="h-8 w-2/3" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
