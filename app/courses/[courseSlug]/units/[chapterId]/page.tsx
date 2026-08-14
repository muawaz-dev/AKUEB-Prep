import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentBlockView } from "@/components/lesson/ContentBlockView";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ courseSlug: string; chapterId: string }>;
}) {
  const { courseSlug, chapterId } = await params;

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, status: "PUBLISHED" },
    include: {
      course: true,
      contentBlocks: { orderBy: { orderIndex: "asc" } },
      topics: {
        where: { status: "PUBLISHED" },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!chapter || chapter.course.slug !== courseSlug) notFound();

  return (
    <div className="max-w-3xl mx-auto w-full p-6 flex flex-col gap-8">
      <div>
        <Link href={`/courses/${courseSlug}`} className="text-sm text-black/50 dark:text-white/50 hover:underline">
          &larr; {chapter.course.title}
        </Link>
        <h1 className="text-2xl font-semibold mt-1">
          {chapter.orderIndex}. {chapter.title}
        </h1>
      </div>

      {chapter.contentBlocks.length > 0 && (
        <div className="flex flex-col gap-4">
          {chapter.contentBlocks.map((block) => (
            <ContentBlockView
              key={block.id}
              blockType={block.blockType}
              content={block.content as Record<string, unknown>}
            />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-2 text-black/60 dark:text-white/60">Lessons</h2>
        <ul className="flex flex-col gap-1">
          {chapter.topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/courses/${courseSlug}/lessons/${topic.id}`}
                className="block rounded px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-sm"
              >
                {topic.code} {topic.title}
              </Link>
            </li>
          ))}
          {chapter.topics.length === 0 && (
            <li className="text-sm text-black/40 dark:text-white/40 px-3 py-2">No lessons yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
