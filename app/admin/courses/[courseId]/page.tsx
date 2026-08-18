import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma/enums";
import { updateCourse } from "../actions";
import { createChapter } from "../../chapters/actions";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      class: true,
      subject: true,
      chapters: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { topics: true } } },
      },
    },
  });

  if (!course) notFound();

  const nextOrderIndex = course.chapters.length
    ? Math.max(...course.chapters.map((c) => c.orderIndex)) + 1
    : 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/courses" className="text-sm text-black/50 dark:text-white/50 hover:underline">
          &larr; Courses
        </Link>
        <h1 className="text-xl font-semibold mt-1">{course.title}</h1>
      </div>

      <form action={updateCourse} className="flex flex-col gap-3 max-w-sm border border-black/10 dark:border-white/10 rounded p-4">
        <input type="hidden" name="id" value={course.id} />
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input name="title" defaultValue={course.title} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Subject
          <input name="subject" defaultValue={course.subject.name} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Class level
          <input name="classLevel" type="number" defaultValue={course.class.level} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue={course.status} className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent">
            {Object.values(ContentStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium">
          Save
        </button>
      </form>

      <div>
        <h2 className="text-sm font-semibold mb-2 text-black/60 dark:text-white/60">
          Chapters (units)
        </h2>
        <ul className="flex flex-col gap-2">
          {course.chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                href={`/admin/chapters/${chapter.id}`}
                className="flex items-center justify-between border border-black/10 dark:border-white/10 rounded px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span>
                  {chapter.orderIndex}. {chapter.title}
                </span>
                <span className="text-xs text-black/50 dark:text-white/50">
                  {chapter._count.topics} topics - {chapter.status}
                </span>
              </Link>
            </li>
          ))}
          {course.chapters.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">No chapters yet.</p>
          )}
        </ul>
      </div>

      <details className="border border-black/10 dark:border-white/10 rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">Add a chapter</summary>
        <form action={createChapter} className="flex flex-col gap-3 mt-4 max-w-sm">
          <input type="hidden" name="courseId" value={course.id} />
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input name="title" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Order (chapter number)
            <input name="orderIndex" type="number" defaultValue={nextOrderIndex} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium">
            Add chapter
          </button>
        </form>
      </details>
    </div>
  );
}
