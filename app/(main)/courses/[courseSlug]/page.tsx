import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MarkdownContent } from "@/components/lesson/MarkdownContent";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;

  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: "PUBLISHED" },
    include: {
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { orderIndex: "asc" },
        include: {
          topics: {
            where: { status: "PUBLISHED" },
            orderBy: { orderIndex: "asc" },
            include: {
              slos: { where: { status: "PUBLISHED" }, select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const user = await getCurrentUser();
  const allSloIds = course.chapters.flatMap((c) => c.topics.flatMap((t) => t.slos.map((s) => s.id)));
  const progressRows = user && allSloIds.length
    ? await prisma.userProgress.findMany({
        where: { userId: user.id, sloId: { in: allSloIds } },
        select: { sloId: true, status: true },
      })
    : [];
  const progressMap = new Map(progressRows.map((p) => [p.sloId, p.status]));

  function topicCompletionPct(sloIds: string[]): number {
    if (sloIds.length === 0) return 0;
    const completed = sloIds.filter((id) => progressMap.get(id) === "COMPLETED").length;
    return Math.round((completed / sloIds.length) * 100);
  }

  const totalLessons = course.chapters.reduce((n, c) => n + c.topics.length, 0);
  const completedLessons = course.chapters.reduce(
    (n, c) => n + c.topics.filter((t) => topicCompletionPct(t.slos.map((s) => s.id)) === 100).length,
    0
  );

  return (
    <div className="max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
      <div>
        <Link href="/courses" className="text-base text-black/50 dark:text-white/50 hover:underline">
          &larr; Courses
        </Link>
        <h1 className="text-3xl font-semibold mt-1">{course.title}</h1>
        <p className="text-base text-black/60 dark:text-white/60">
          Class {course.classLevel} - {course.subject}
        </p>
        {user ? (
          <p className="text-base text-black/60 dark:text-white/60 mt-1">
            {completedLessons} of {totalLessons} lessons complete
          </p>
        ) : (
          <p className="text-base text-black/50 dark:text-white/50 mt-1">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to track your progress through this course.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {course.chapters.map((chapter) => (
          <div key={chapter.id}>
            <Link href={`/courses/${course.slug}/units/${chapter.id}`} className="group inline-flex flex-col mb-3">
              <span className="text-sm font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
                Unit {chapter.orderIndex}
              </span>
              <span className="text-lg font-semibold group-hover:underline">
                <MarkdownContent text={chapter.title} inline />
              </span>
            </Link>
            <div className="flex flex-wrap gap-2">
              {chapter.topics.map((topic) => {
                const sloIds = topic.slos.map((s) => s.id);
                const pct = topicCompletionPct(sloIds);
                return (
                  <Link
                    key={topic.id}
                    href={`/courses/${course.slug}/lessons/${topic.id}`}
                    title={`${topic.code} ${topic.title} - ${pct}% complete`}
                    className="relative min-w-12 h-11 overflow-hidden rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 hover:border-black dark:hover:border-white"
                  >
                    {pct > 0 && (
                      <span
                        className="absolute inset-y-0 left-0 bg-brand"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-full items-center justify-center px-1.5 text-sm ${
                        pct >= 50 ? "text-white" : "text-black/70 dark:text-white/70"
                      }`}
                    >
                      {topic.code}
                    </span>
                  </Link>
                );
              })}
              {chapter.topics.length === 0 && (
                <p className="text-base text-black/40 dark:text-white/40">No lessons yet.</p>
              )}
            </div>
          </div>
        ))}
        {course.chapters.length === 0 && (
          <p className="text-base text-black/50 dark:text-white/50">No chapters published yet.</p>
        )}
      </div>
    </div>
  );
}
