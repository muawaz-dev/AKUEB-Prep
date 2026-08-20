import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto w-full px-8 pt-20 pb-16 flex flex-col gap-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="h-5 w-2/3 max-w-2xl" />
      <Skeleton className="h-10 w-40 mt-2" />
    </div>
  );
}
