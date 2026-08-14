import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { updateTopic, deleteTopic } from "../actions";
import { createSlo } from "../../slos/actions";

export default async function AdminTopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      chapter: { include: { course: true } },
      slos: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { contentBlocks: true, questions: true } } },
      },
    },
  });

  if (!topic) notFound();

  const nextOrderIndex = topic.slos.length
    ? Math.max(...topic.slos.map((s) => s.orderIndex)) + 1
    : 1;
  const nextCode = `${topic.code}.${nextOrderIndex}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/admin/chapters/${topic.chapterId}`} className="text-sm text-black/50 dark:text-white/50 hover:underline">
          &larr; {topic.chapter.course.title} / {topic.chapter.title}
        </Link>
        <h1 className="text-xl font-semibold mt-1">
          {topic.code} {topic.title}
        </h1>
      </div>

      <form action={updateTopic} className="flex flex-col gap-3 max-w-sm border border-black/10 dark:border-white/10 rounded p-4">
        <input type="hidden" name="id" value={topic.id} />
        <input type="hidden" name="chapterId" value={topic.chapterId} />
        <label className="flex flex-col gap-1 text-sm">
          Code
          <input name="code" defaultValue={topic.code} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input name="title" defaultValue={topic.title} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Order
          <input name="orderIndex" type="number" defaultValue={topic.orderIndex} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select name="status" defaultValue={topic.status} className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent">
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
          SLOs (sub-lessons)
        </h2>
        <ul className="flex flex-col gap-2">
          {topic.slos.map((slo) => (
            <li key={slo.id}>
              <Link
                href={`/admin/slos/${slo.id}`}
                className="flex items-center justify-between border border-black/10 dark:border-white/10 rounded px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span>
                  {slo.code} {slo.sloText}
                </span>
                <span className="text-xs text-black/50 dark:text-white/50 whitespace-nowrap ml-4">
                  {slo._count.contentBlocks} blocks - {slo._count.questions} qs - {slo.status}
                </span>
              </Link>
            </li>
          ))}
          {topic.slos.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">No SLOs yet.</p>
          )}
        </ul>
      </div>

      <details className="border border-black/10 dark:border-white/10 rounded p-4">
        <summary className="cursor-pointer text-sm font-medium">Add an SLO</summary>
        <form action={createSlo} className="flex flex-col gap-3 mt-4 max-w-lg">
          <input type="hidden" name="topicId" value={topic.id} />
          <label className="flex flex-col gap-1 text-sm">
            Code (e.g. {nextCode})
            <input name="code" defaultValue={nextCode} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            SLO text
            <textarea name="sloText" required rows={2} className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Cognitive level (R / U / A / An / E / FA)
            <input name="cognitiveLevel" required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Order
            <input name="orderIndex" type="number" defaultValue={nextOrderIndex} required className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent" />
          </label>
          <button type="submit" className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium">
            Add SLO
          </button>
        </form>
      </details>

      <form action={deleteTopic} className="border border-red-600/30 rounded p-4">
        <input type="hidden" name="id" value={topic.id} />
        <input type="hidden" name="chapterId" value={topic.chapterId} />
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">
          Deleting a topic deletes all its SLOs, content, and questions.
        </p>
        <ConfirmSubmitButton
          confirmMessage={`Delete topic "${topic.title}" and everything inside it? This cannot be undone.`}
          className="text-sm text-red-600 hover:underline"
        >
          Delete topic
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
