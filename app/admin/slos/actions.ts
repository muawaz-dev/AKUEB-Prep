"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus } from "@/app/generated/prisma/enums";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

// ---- SLOs ----

export async function createSlo(formData: FormData) {
  await requireAdmin();
  const topicId = field(formData, "topicId");
  const code = field(formData, "code");
  const sloText = field(formData, "sloText");
  const cognitiveLevel = field(formData, "cognitiveLevel");
  const orderIndex = Number(formData.get("orderIndex"));

  if (!topicId || !code || !sloText || !cognitiveLevel || !Number.isFinite(orderIndex)) {
    throw new Error("Missing or invalid fields");
  }

  const slo = await prisma.slo.create({
    data: { topicId, code, sloText, cognitiveLevel, orderIndex, status: "DRAFT" },
  });

  revalidatePath(`/admin/topics/${topicId}`);
  redirect(`/admin/slos/${slo.id}`);
}

export async function updateSlo(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const topicId = field(formData, "topicId");
  const code = field(formData, "code");
  const sloText = field(formData, "sloText");
  const cognitiveLevel = field(formData, "cognitiveLevel");
  const orderIndex = Number(formData.get("orderIndex"));
  const status = field(formData, "status") as ContentStatus;

  await prisma.slo.update({
    where: { id },
    data: { code, sloText, cognitiveLevel, orderIndex, status },
  });

  revalidatePath(`/admin/slos/${id}`);
  revalidatePath(`/admin/topics/${topicId}`);
}

export async function deleteSlo(formData: FormData) {
  await requireAdmin();
  const id = field(formData, "id");
  const topicId = field(formData, "topicId");

  await prisma.slo.delete({ where: { id } });

  revalidatePath(`/admin/topics/${topicId}`);
  redirect(`/admin/topics/${topicId}`);
}
