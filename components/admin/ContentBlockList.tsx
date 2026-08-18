"use client";

import { useState, useTransition } from "react";
import type { BlockType } from "@/app/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ContentBlockForm } from "@/components/admin/ContentBlockForm";

type Block = {
  id: string;
  orderIndex: number;
  blockType: BlockType;
  content: Record<string, unknown>;
};

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

// Lets the admin retype order numbers for every block right on this list and
// save them all in one request, instead of opening each block's edit form
// just to change its "Order" field.
export function ContentBlockList({
  blocks,
  owner,
  updateAction,
  deleteAction,
  reorderAction,
  emptyMessage,
}: {
  blocks: Block[];
  owner: { field: "sloId"; id: string } | { field: "chapterId"; id: string } | { field: "topicId"; id: string };
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
  reorderAction: (formData: FormData) => void;
  emptyMessage: string;
}) {
  const sorted = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
  const [order, setOrder] = useState<Record<string, number>>(
    Object.fromEntries(sorted.map((b) => [b.id, b.orderIndex]))
  );
  const [isPending, startTransition] = useTransition();

  const dirty = sorted.some((b) => order[b.id] !== b.orderIndex);

  function saveOrder() {
    const formData = new FormData();
    formData.set(owner.field, owner.id);
    for (const b of sorted) {
      formData.append("blockId", b.id);
      formData.append("blockOrderIndex", String(order[b.id]));
    }
    startTransition(() => reorderAction(formData));
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-black/50 dark:text-white/50">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((block) => (
        <details key={block.id} className="border border-black/10 dark:border-white/10 rounded p-4">
          <summary className="flex items-center gap-3 cursor-pointer text-sm">
            <input
              type="number"
              value={order[block.id]}
              onChange={(e) => setOrder((o) => ({ ...o, [block.id]: Number(e.target.value) }))}
              onClick={(e) => e.preventDefault()}
              aria-label={`Order for ${block.blockType} block`}
              className="w-16 shrink-0 border border-black/20 dark:border-white/20 rounded px-2 py-1 bg-transparent"
            />
            <span className="font-medium shrink-0">{block.blockType}</span>
            <span className="text-black/50 dark:text-white/50 truncate">
              {blockPreview(block.blockType, block.content).slice(0, 80)}
            </span>
          </summary>
          <div className="mt-4">
            <ContentBlockForm
              owner={owner}
              action={updateAction}
              initial={{ id: block.id, blockType: block.blockType, orderIndex: block.orderIndex, content: block.content }}
            />
            <form action={deleteAction} className="mt-3">
              <input type="hidden" name="id" value={block.id} />
              <input type="hidden" name={owner.field} value={owner.id} />
              <ConfirmSubmitButton confirmMessage="Delete this content block?" className="text-sm text-red-600 hover:underline">
                Delete block
              </ConfirmSubmitButton>
            </form>
          </div>
        </details>
      ))}

      <button
        type="button"
        onClick={saveOrder}
        disabled={!dirty || isPending}
        className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium w-fit disabled:opacity-40"
      >
        {isPending ? "Saving order..." : "Save order"}
      </button>
    </div>
  );
}
