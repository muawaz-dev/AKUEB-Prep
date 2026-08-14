import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ProgressStatus } from "@/app/generated/prisma/enums";
import { LessonView } from "@/components/lesson/LessonView";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; topicId: string }>;
}) {
  const { courseSlug, topicId } = await params;

  const topic = await prisma.topic.findFirst({
    where: { id: topicId, status: "PUBLISHED" },
    include: {
      chapter: {
        include: {
          course: true,
          topics: {
            where: { status: "PUBLISHED" },
            orderBy: { orderIndex: "asc" },
            select: { id: true, code: true, title: true, orderIndex: true },
          },
        },
      },
      slos: {
        where: { status: "PUBLISHED" },
        orderBy: { orderIndex: "asc" },
        include: {
          contentBlocks: { orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });

  if (!topic || topic.chapter.course.slug !== courseSlug) notFound();

  const user = await getCurrentUser();
  const progressRows = user
    ? await prisma.userProgress.findMany({
        where: { userId: user.id, sloId: { in: topic.slos.map((s) => s.id) } },
        select: { sloId: true, status: true },
      })
    : [];
  const initialProgress: Record<string, ProgressStatus> = Object.fromEntries(
    progressRows.map((p) => [p.sloId, p.status])
  );

  const siblingTopics = topic.chapter.topics;
  const currentIndex = siblingTopics.findIndex((t) => t.id === topic.id);
  const prevTopic = currentIndex > 0 ? siblingTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < siblingTopics.length - 1 ? siblingTopics[currentIndex + 1] : null;

  const breadcrumb = (
    <>
      <Link href={`/courses/${courseSlug}`} className="hover:underline">
        {topic.chapter.course.title}
      </Link>
      {" > "}
      <Link href={`/courses/${courseSlug}/units/${topic.chapterId}`} className="hover:underline">
        Unit {topic.chapter.orderIndex}
      </Link>
    </>
  );

  return (
    <LessonView
      courseSlug={courseSlug}
      breadcrumb={breadcrumb}
      topicTitle={`${topic.code} ${topic.title}`}
      slos={topic.slos.map((slo) => ({
        id: slo.id,
        code: slo.code,
        sloText: slo.sloText,
        contentBlocks: slo.contentBlocks.map((b) => ({
          id: b.id,
          blockType: b.blockType,
          content: b.content as Record<string, unknown>,
        })),
      }))}
      prevTopic={prevTopic}
      nextTopic={nextTopic}
      isLoggedIn={Boolean(user)}
      initialProgress={initialProgress}
    />
  );
}
