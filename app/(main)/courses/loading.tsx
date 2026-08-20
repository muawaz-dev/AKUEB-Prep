import { Skeleton } from "@/components/Skeleton";

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 flex flex-col gap-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-10">
      <Skeleton className="h-8 w-40" />

      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </div>
      </section>
    </div>
  );
}
