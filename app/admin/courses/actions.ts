"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus } from "@/app/generated/prisma/enums";

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const classLevel = Number(formData.get("classLevel"));

  if (!title || !slug || !subject || !Number.isFinite(classLevel)) {
    throw new Error("Missing or invalid fields");
  }

  const course = await prisma.course.create({
    data: { title, slug, subject, classLevel, status: "DRAFT" },
  });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const classLevel = Number(formData.get("classLevel"));
  const status = String(formData.get("status") ?? "") as ContentStatus;

  await prisma.course.update({
    where: { id },
    data: { title, subject, classLevel, status },
  });

  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
}
