import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentBlockView } from "@/components/lesson/ContentBlockView";
import { MarkdownContent } from "@/components/lesson/MarkdownContent";
import { UnitSidebar } from "@/components/lesson/UnitSidebar";

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
    <UnitSidebar
      courseSlug={courseSlug}
      courseTitle={chapter.course.title}
      chapterId={chapterId}
      chapterTitle={chapter.title}
      chapterOrderIndex={chapter.orderIndex}
      topics={chapter.topics}
    >
      <div className="max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
        <h1 className="text-3xl font-semibold">
          Unit {chapter.orderIndex}: <MarkdownContent text={chapter.title} inline />
        </h1>

        {chapter.contentBlocks.length > 0 && (
          <div className="flex flex-col gap-8">
            {chapter.contentBlocks.map((block) => (
              <ContentBlockView
                key={block.id}
                blockType={block.blockType}
                content={block.content as Record<string, unknown>}
              />
            ))}
          </div>
        )}
      </div>
    </UnitSidebar>
  );
}
