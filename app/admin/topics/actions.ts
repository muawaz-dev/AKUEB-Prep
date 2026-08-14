"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus } from "@/app/generated/prisma/enums";

export async function createTopic(formData: FormData) {
  await requireAdmin();
  const chapterId = String(formData.get("chapterId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const orderIndex = Number(formData.get("orderIndex"));

  if (!chapterId || !code || !title || !Number.isFinite(orderIndex)) {
    throw new Error("Missing or invalid fields");
  }

  const topic = await prisma.topic.create({
    data: { chapterId, code, title, orderIndex, status: "DRAFT" },
  });

  revalidatePath(`/admin/chapters/${chapterId}`);
  redirect(`/admin/topics/${topic.id}`);
}

export async function updateTopic(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const orderIndex = Number(formData.get("orderIndex"));
  const status = String(formData.get("status") ?? "") as ContentStatus;

  await prisma.topic.update({
    where: { id },
    data: { code, title, orderIndex, status },
  });

  revalidatePath(`/admin/topics/${id}`);
  revalidatePath(`/admin/chapters/${chapterId}`);
}

export async function deleteTopic(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");

  await prisma.topic.delete({ where: { id } });

  revalidatePath(`/admin/chapters/${chapterId}`);
  redirect(`/admin/chapters/${chapterId}`);
}
