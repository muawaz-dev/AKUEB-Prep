import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto w-full p-8 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-black/10 dark:border-white/10 p-5 flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex-1 rounded-xl border border-black/10 dark:border-white/10 p-5 flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-full max-w-md" />
        <Skeleton className="h-16 w-full" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-full max-w-md" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
