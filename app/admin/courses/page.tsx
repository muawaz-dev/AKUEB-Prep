import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCourse } from "./actions";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: [{ classLevel: "asc" }, { orderIndex: "asc" }],
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Courses</h1>

      <ul className="flex flex-col gap-2">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/admin/courses/${course.id}`}
              className="flex items-center justify-between border border-black/10 dark:border-white/10 rounded px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>
                {course.title}{" "}
                <span className="text-xs text-black/50 dark:text-white/50">
                  (Class {course.classLevel} - {course.subject})
                </span>
              </span>
              <span className="text-xs text-black/50 dark:text-white/50">
                {course._count.chapters} chapters - {course.status}
              </span>
            </Link>
          </li>
        ))}
        {courses.length === 0 && (
          <p className="text-sm text-black/50 dark:text-white/50">No courses yet.</p>
        )}
      </ul>

      <details className="border border-black/10 dark:border-white/10 rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">Add a new course</summary>
        <form action={createCourse} className="flex flex-col gap-3 mt-4 max-w-sm">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input name="title" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Slug (URL-friendly, unique)
            <input name="slug" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Subject
            <input name="subject" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Class level
            <input name="classLevel" type="number" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium">
            Create course
          </button>
        </form>
      </details>
    </div>
  );
}
