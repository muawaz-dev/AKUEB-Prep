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

  const chapter = await prisma.chapter.create({
    data: { courseId, title, orderIndex, status: "DRAFT" },
  });

  revalidatePath(`/admin/courses/${courseId}`);
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
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteChapter(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courseId = String(formData.get("courseId") ?? "");

  await prisma.chapter.delete({ where: { id } });

  revalidatePath(`/admin/courses/${courseId}`);
  redirect(`/admin/courses/${courseId}`);
}
