import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ classLevel: "asc" }, { orderIndex: "asc" }],
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto w-full p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Courses</h1>
      <ul className="flex flex-col gap-3">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.slug}`}
              className="block border border-black/10 dark:border-white/10 rounded-lg p-5 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="font-semibold">{course.title}</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Class {course.classLevel} - {course.subject} - {course._count.chapters} chapters
              </div>
            </Link>
          </li>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-black/50 dark:text-white/50">No courses published yet.</p>
        )}
      </ul>
    </div>
  );
}
