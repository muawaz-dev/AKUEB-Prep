import { Skeleton } from "@/components/Skeleton";

// Same reasoning as the unit page's loading.tsx: LessonView's own sidebar
// depends on the same fetch as the content, so this approximates both
// regions' dimensions rather than trying to render the real sidebar early.
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
      <div className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col gap-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-40 w-full mt-4" />
      </div>
    </div>
  );
}
