import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CourseCard } from "@/components/CourseCard";

export default async function CoursesPage() {
  const [courses, user] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ classLevel: "asc" }, { orderIndex: "asc" }],
      include: {
        _count: { select: { chapters: true } },
        chapters: {
          where: { status: "PUBLISHED" },
          select: {
            topics: {
              where: { status: "PUBLISHED" },
              select: { slos: { where: { status: "PUBLISHED" }, select: { id: true } } },
            },
          },
        },
      },
    }),
    getCurrentUser(),
  ]);

  const coursesWithSlos = courses.map((course) => ({
    ...course,
    sloIds: course.chapters.flatMap((c) => c.topics.flatMap((t) => t.slos.map((s) => s.id))),
  }));

  const allSloIds = coursesWithSlos.flatMap((c) => c.sloIds);
  const progressRows =
    user && allSloIds.length
      ? await prisma.userProgress.findMany({
          where: { userId: user.id, sloId: { in: allSloIds } },
          select: { sloId: true, status: true },
        })
      : [];
  const progressMap = new Map(progressRows.map((p) => [p.sloId, p.status]));

  const enrolled: typeof coursesWithSlos = [];
  const available: typeof coursesWithSlos = [];
  for (const course of coursesWithSlos) {
    const started = course.sloIds.some((id) => progressMap.has(id));
    (started ? enrolled : available).push(course);
  }

  function progressFor(course: (typeof coursesWithSlos)[number]) {
    const completed = course.sloIds.filter((id) => progressMap.get(id) === "COMPLETED").length;
    return { completed, total: course.sloIds.length };
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-8 flex flex-col gap-10">
      <h1 className="text-3xl font-semibold">Courses</h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Enrolled Courses</h2>
        {!user ? (
          <p className="text-base text-black/50 dark:text-white/50">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to see courses you&apos;ve started.
          </p>
        ) : enrolled.length === 0 ? (
          <p className="text-base text-black/50 dark:text-white/50">
            You haven&apos;t started a course yet - pick one below to get going.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((course) => (
              <CourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                classLevel={course.classLevel}
                subject={course.subject}
                chapterCount={course._count.chapters}
                progress={progressFor(course)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Available Courses</h2>
        {available.length === 0 ? (
          <p className="text-base text-black/50 dark:text-white/50">No other courses published yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((course) => (
              <CourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                classLevel={course.classLevel}
                subject={course.subject}
                chapterCount={course._count.chapters}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
