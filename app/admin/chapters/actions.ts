"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus } from "@/app/generated/prisma/enums";

export async function createChapter(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const orderIndex = Number(formData.get("orderIndex"));

  if (!courseId || !title || !Number.isFinite(orderIndex)) {
    throw new Error("Missing or invalid fields");
  }

  // A chapter's class/subject come from the course it's created under -
  // Chapter itself doesn't require a course (see its model comment in
  // schema.prisma), but this creation flow is specifically "add a chapter to
  // this course", so it inherits that course's class/subject directly.
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: { classId: true, subjectId: true } });

  const chapter = await prisma.chapter.create({
    data: { courseId, classId: course.classId, subjectId: course.subjectId, title, orderIndex, status: "DRAFT" },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/question-bank", "layout");
  redirect(`/admin/chapters/${chapter.id}`);
}

export async function updateChapter(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const orderIndex = Number(formData.get("orderIndex"));
  const status = String(formData.get("status") ?? "") as ContentStatus;

  await prisma.chapter.update({
    where: { id },
    data: { title, orderIndex, status },
  });

  revalidatePath(`/admin/chapters/${id}`);
  if (courseId) revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/question-bank", "layout");
}

export async function deleteChapter(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");

  await prisma.chapter.delete({ where: { id } });

  revalidatePath("/question-bank", "layout");
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}`);
  }
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}
