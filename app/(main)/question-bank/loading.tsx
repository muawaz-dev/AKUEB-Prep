import { Skeleton } from "@/components/Skeleton";

function QuestionCardSkeleton() {
  return (
    <div className="pb-8 border-b-2 border-black/10 dark:border-white/10 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="rounded p-4 flex flex-col gap-3 bg-black/[0.04] dark:bg-white/[0.06]">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex flex-col gap-2 mt-1">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-9 w-28 mt-1" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto w-full p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-36" />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="flex flex-col gap-8 mt-2">
        <QuestionCardSkeleton />
        <QuestionCardSkeleton />
        <QuestionCardSkeleton />
      </div>
    </div>
  );
}
