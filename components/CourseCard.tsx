import Link from "next/link";

export function CourseCard({
  slug,
  title,
  classLevel,
  subject,
  chapterCount,
  progress,
}: {
  slug: string;
  title: string;
  classLevel: number;
  subject: string;
  chapterCount: number;
  progress?: { completed: number; total: number } | null;
}) {
  const pct = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : null;

  return (
    <Link
      href={`/courses/${slug}`}
      className="flex flex-col gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm hover:shadow-md hover:border-brand/40 dark:hover:border-blue-400/40 transition-shadow"
    >
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <div className="text-base text-black/60 dark:text-white/60">
          Class {classLevel} - {subject} - {chapterCount} {chapterCount === 1 ? "unit" : "units"}
        </div>
      </div>
      {pct !== null && (
        <div className="flex flex-col gap-1 mt-auto">
          <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm text-black/50 dark:text-white/50">{pct}% complete</span>
        </div>
      )}
    </Link>
  );
}
