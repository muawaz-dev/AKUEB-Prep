import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

  function topicState(sloIds: string[]): "done" | "started" | "none" {
    if (sloIds.length === 0) return "none";
    const statuses = sloIds.map((id) => progressMap.get(id));
    if (statuses.every((s) => s === "COMPLETED")) return "done";
    if (statuses.some((s) => s === "COMPLETED" || s === "IN_PROGRESS")) return "started";
    return "none";
  }

  const totalLessons = course.chapters.reduce((n, c) => n + c.topics.length, 0);
  const completedLessons = course.chapters.reduce(
    (n, c) => n + c.topics.filter((t) => topicState(t.slos.map((s) => s.id)) === "done").length,
    0
  );

  return (
    <div className="flex">
      <aside className="w-64 shrink-0 border-r border-black/10 dark:border-white/10 sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto hidden md:block">
        <div className="p-4 border-b border-black/10 dark:border-white/10">
          <div className="font-semibold">{course.title}</div>
          <div className="text-xs text-black/50 dark:text-white/50 mt-0.5">
            {course.chapters.length} units - {totalLessons} lessons
          </div>
          {user && (
            <div className="text-xs text-black/50 dark:text-white/50 mt-1">
              {completedLessons} of {totalLessons} lessons complete
            </div>
          )}
        </div>
        <nav className="flex flex-col py-2">
          {course.chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#unit-${chapter.id}`}
              className="flex flex-col px-4 py-2 border-l-2 border-transparent hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="text-[11px] font-medium text-black/45 dark:text-white/45 uppercase tracking-wide">
                Unit {chapter.orderIndex}
              </span>
              <span className="text-sm text-black/80 dark:text-white/80">{chapter.title}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col gap-8">
        <div>
          <Link href="/courses" className="text-sm text-black/50 dark:text-white/50 hover:underline">
            &larr; Courses
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{course.title}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Class {course.classLevel} - {course.subject}
          </p>
          {user ? (
            <p className="text-sm text-black/60 dark:text-white/60 mt-1">
              {completedLessons} of {totalLessons} lessons complete
            </p>
          ) : (
            <p className="text-sm text-black/50 dark:text-white/50 mt-1">
              <Link href="/login" className="underline">
                Log in
              </Link>{" "}
              to track your progress through this course.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {course.chapters.map((chapter) => (
            <div key={chapter.id} id={`unit-${chapter.id}`} className="scroll-mt-20">
              <Link href={`/courses/${course.slug}/units/${chapter.id}`} className="group inline-flex flex-col mb-3">
                <span className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-wide">
                  Unit {chapter.orderIndex}
                </span>
                <span className="font-semibold group-hover:underline">{chapter.title}</span>
              </Link>
              <div className="flex flex-wrap gap-2">
                {chapter.topics.map((topic) => {
                  const state = topicState(topic.slos.map((s) => s.id));
                  return (
                    <Link
                      key={topic.id}
                      href={`/courses/${course.slug}/lessons/${topic.id}`}
                      title={`${topic.code} ${topic.title}`}
                      className={`min-w-11 h-10 px-1.5 flex items-center justify-center rounded border text-xs hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white ${
                        state === "done"
                          ? "border-green-600 text-green-700 dark:text-green-500 bg-green-600/10"
                          : state === "started"
                            ? "border-black/40 dark:border-white/40 text-black/70 dark:text-white/70"
                            : "border-black/20 dark:border-white/20 text-black/60 dark:text-white/60"
                      }`}
                    >
                      {topic.code}
                    </Link>
                  );
                })}
                {chapter.topics.length === 0 && (
                  <p className="text-sm text-black/40 dark:text-white/40">No lessons yet.</p>
                )}
              </div>
            </div>
          ))}
          {course.chapters.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">No chapters published yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
