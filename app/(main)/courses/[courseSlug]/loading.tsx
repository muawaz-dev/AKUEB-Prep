import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-2/3 mt-1" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="flex flex-col gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-5 w-48 mb-3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-11 w-12" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
