import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-56" />
      </div>

      <Skeleton className="h-64 w-full max-w-sm" />

      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>

      <Skeleton className="h-12 w-full" />
    </div>
  );
}
