import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma/enums";
import type { BlockType } from "@/app/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ContentBlockForm } from "@/components/admin/ContentBlockForm";
import { updateSlo, deleteSlo } from "../actions";
import { createContentBlock, updateContentBlock, deleteContentBlock } from "../../content-blocks/actions";

function blockPreview(blockType: BlockType, content: Record<string, unknown>): string {
  switch (blockType) {
    case "TEXT":
      return String(content.text ?? "");
    case "VIDEO":
      return `YouTube: ${content.youtubeId ?? ""}`;
    case "IMAGE":
      return String(content.url ?? "");
    case "FORMULA":
      return String(content.latex ?? "");
    case "WORKED_EXAMPLE":
      return String(content.problem ?? "");
    case "CALLOUT":
      return String(content.text ?? "");
    case "QUESTION":
      return String(content.prompt ?? "");
  }
}

export default async function AdminSloDetailPage({
  params,
}: {
  params: Promise<{ sloId: string }>;
}) {
  const { sloId } = await params;

  const slo = await prisma.slo.findUnique({
    where: { id: sloId },
    include: {
      topic: { include: { chapter: { include: { course: true } } } },
      contentBlocks: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!slo) notFound();

  const nextBlockOrderIndex = slo.contentBlocks.length
    ? Math.max(...slo.contentBlocks.map((b) => b.orderIndex)) + 1
    : 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/admin/topics/${slo.topicId}`} className="text-sm text-black/50 dark:text-white/50 hover:underline">
          &larr; {slo.topic.chapter.course.title} / {slo.topic.chapter.title} / {slo.topic.title}
        </Link>
        <h1 className="text-xl font-semibold mt-1">
          {slo.code} {slo.sloText}
        </h1>
      </div>

      <details className="border border-black/10 dark:border-white/10 rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">SLO details</summary>
        <form action={updateSlo} className="flex flex-col gap-3 mt-4 max-w-lg">
          <input type="hidden" name="id" value={slo.id} />
          <input type="hidden" name="topicId" value={slo.topicId} />
          <label className="flex flex-col gap-1 text-sm">
            Code
            <input name="code" defaultValue={slo.code} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            SLO text
            <textarea name="sloText" defaultValue={slo.sloText} required rows={2} className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cognitive level
            <input name="cognitiveLevel" defaultValue={slo.cognitiveLevel} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Order
            <input name="orderIndex" type="number" defaultValue={slo.orderIndex} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select name="status" defaultValue={slo.status} className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent">
              {Object.values(ContentStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium w-fit">
            Save
          </button>
        </form>

        <form action={deleteSlo} className="mt-4">
          <input type="hidden" name="id" value={slo.id} />
          <input type="hidden" name="topicId" value={slo.topicId} />
          <ConfirmSubmitButton
            confirmMessage={`Delete SLO "${slo.code}" and all its content? This cannot be undone.`}
            className="text-sm text-red-600 hover:underline"
          >
            Delete SLO
          </ConfirmSubmitButton>
        </form>
      </details>

      <div>
        <h2 className="text-sm font-semibold mb-2 text-black/60 dark:text-white/60">
          Content blocks ({slo.contentBlocks.length})
        </h2>
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">
          Includes inline comprehension questions (block type &quot;QUESTION&quot;) - place them wherever they help
          clarify the explanation. These are separate from the SLO/unit/course test bank, which is built elsewhere.
        </p>
        <div className="flex flex-col gap-2">
          {slo.contentBlocks.map((block) => (
            <details key={block.id} className="border border-black/10 dark:border-white/10 rounded p-4">
              <summary className="cursor-pointer text-sm">
                <span className="font-medium">
                  {block.orderIndex}. {block.blockType}
                </span>{" "}
                <span className="text-black/50 dark:text-white/50">
                  {blockPreview(block.blockType, block.content as Record<string, unknown>).slice(0, 80)}
                </span>
              </summary>
              <div className="mt-4">
                <ContentBlockForm
                  owner={{ field: "sloId", id: slo.id }}
                  action={updateContentBlock}
                  initial={{
                    id: block.id,
                    blockType: block.blockType,
                    orderIndex: block.orderIndex,
                    content: block.content as Record<string, unknown>,
                  }}
                />
                <form action={deleteContentBlock} className="mt-3">
                  <input type="hidden" name="id" value={block.id} />
                  <input type="hidden" name="sloId" value={slo.id} />
                  <ConfirmSubmitButton confirmMessage="Delete this content block?" className="text-sm text-red-600 hover:underline">
                    Delete block
                  </ConfirmSubmitButton>
                </form>
              </div>
            </details>
          ))}
          {slo.contentBlocks.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">No content blocks yet.</p>
          )}
        </div>

        <details className="border border-black/10 dark:border-white/10 rounded p-4 mt-2">
          <summary className="cursor-pointer text-sm font-medium">Add a content block</summary>
          <div className="mt-4">
            <ContentBlockForm owner={{ field: "sloId", id: slo.id }} action={createContentBlock} initial={{ id: "", blockType: "TEXT" as BlockType, orderIndex: nextBlockOrderIndex, content: {} }} />
          </div>
        </details>
      </div>
    </div>
  );
}
