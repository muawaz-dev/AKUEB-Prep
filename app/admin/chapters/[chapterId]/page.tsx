import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { BlockType } from "@/app/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ContentBlockForm } from "@/components/admin/ContentBlockForm";
import { ContentBlockList } from "@/components/admin/ContentBlockList";
import { updateChapter, deleteChapter } from "../actions";
import { createTopic } from "../../topics/actions";
import { createContentBlock, updateContentBlock, deleteContentBlock, reorderContentBlocks } from "../../content-blocks/actions";

export default async function AdminChapterDetailPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      course: true,
      contentBlocks: { orderBy: { orderIndex: "asc" } },
      topics: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { slos: true } } },
      },
    },
  });

  if (!chapter) notFound();

  const nextOrderIndex = chapter.topics.length
    ? Math.max(...chapter.topics.map((t) => t.orderIndex)) + 1
    : 1;
  const nextCode = `${chapter.orderIndex}.${nextOrderIndex}`;
  const nextBlockOrderIndex = chapter.contentBlocks.length
    ? Math.max(...chapter.contentBlocks.map((b) => b.orderIndex)) + 1
    : 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        {chapter.course ? (
          <Link href={`/admin/courses/${chapter.courseId}`} className="text-sm text-black/50 dark:text-white/50 hover:underline">
            &larr; {chapter.course.title}
          </Link>
        ) : (
          <span className="text-sm text-black/50 dark:text-white/50">
            Not attached to a course - created for the question bank
          </span>
        )}
        <h1 className="text-xl font-semibold mt-1">
          {chapter.orderIndex}. {chapter.title}
        </h1>
      </div>

      <form action={updateChapter} className="flex flex-col gap-3 max-w-sm border border-black/10 dark:border-white/10 rounded p-4">
        <input type="hidden" name="id" value={chapter.id} />
        <input type="hidden" name="courseId" value={chapter.courseId ?? ""} />
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input name="title" defaultValue={chapter.title} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Order (chapter number)
          <input name="orderIndex" type="number" defaultValue={chapter.orderIndex} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue={chapter.status} className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent">
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
          Unit intro ({chapter.contentBlocks.length} blocks)
        </h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">
          Shown before the lesson list on this unit&rsquo;s page - same content block types as a lesson.
        </p>
        <ContentBlockList
          blocks={chapter.contentBlocks.map((b) => ({ ...b, content: b.content as Record<string, unknown> }))}
          owner={{ field: "chapterId", id: chapter.id }}
          updateAction={updateContentBlock}
          deleteAction={deleteContentBlock}
          reorderAction={reorderContentBlocks}
          emptyMessage="No intro content yet."
        />

        <details className="border border-black/10 dark:border-white/10 rounded p-4 mt-2">
          <summary className="cursor-pointer text-sm font-medium">Add an intro content block</summary>
          <div className="mt-4">
            <ContentBlockForm
              owner={{ field: "chapterId", id: chapter.id }}
              action={createContentBlock}
              initial={{ id: "", blockType: "TEXT" as BlockType, orderIndex: nextBlockOrderIndex, content: {} }}
            />
          </div>
        </details>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2 text-black/60 dark:text-white/60">
          Topics (lessons)
        </h2>
        <ul className="flex flex-col gap-2">
          {chapter.topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/admin/topics/${topic.id}`}
                className="flex items-center justify-between border border-black/10 dark:border-white/10 rounded px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span>
                  {topic.code} {topic.title}
                </span>
                <span className="text-xs text-black/50 dark:text-white/50">
                  {topic._count.slos} SLOs - {topic.status}
                </span>
              </Link>
            </li>
          ))}
          {chapter.topics.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">No topics yet.</p>
          )}
        </ul>
      </div>

      <details className="border border-black/10 dark:border-white/10 rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">Add a topic (lesson)</summary>
        <form action={createTopic} className="flex flex-col gap-3 mt-4 max-w-sm">
          <input type="hidden" name="chapterId" value={chapter.id} />
          <label className="flex flex-col gap-1 text-sm">
            Code (e.g. {nextCode})
            <input name="code" defaultValue={nextCode} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input name="title" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Order
            <input name="orderIndex" type="number" defaultValue={nextOrderIndex} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium">
            Add topic
          </button>
        </form>
      </details>

      <form action={deleteChapter} className="border border-red-600/30 rounded p-4">
        <input type="hidden" name="id" value={chapter.id} />
        <input type="hidden" name="courseId" value={chapter.courseId ?? ""} />
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">
          Deleting a chapter deletes all its topics, SLOs, content, and questions.
        </p>
        <ConfirmSubmitButton
          confirmMessage={`Delete chapter "${chapter.title}" and everything inside it? This cannot be undone.`}
          className="text-sm text-red-600 hover:underline"
        >
          Delete chapter
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
