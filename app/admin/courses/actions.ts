"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import type { ContentStatus } from "@/app/generated/prisma/enums";

// Class/Subject are typed as plain values here (a level number, a name) and
// resolved to real rows behind the scenes - creating one on the fly if it
// doesn't exist yet, rather than requiring a separate "manage classes" admin
// screen. See the Class/Subject model comments in schema.prisma.
async function resolveClassId(level: number): Promise<string> {
  const cls = await prisma.class.upsert({ where: { level }, update: {}, create: { level } });
  return cls.id;
}
// Case-insensitive so "Mathematics" and "mathematics" resolve to the same
// row instead of silently forking into two - see the matching findOrCreate
// helper in app/admin/questions/actions.ts.
async function resolveSubjectId(name: string): Promise<string> {
  const existing = await prisma.subject.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (existing) return existing.id;
  const created = await prisma.subject.create({ data: { name } });
  return created.id;
}

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const classLevel = Number(formData.get("classLevel"));

  if (!title || !slug || !subject || !Number.isFinite(classLevel)) {
    throw new Error("Missing or invalid fields");
  }

  const [classId, subjectId] = await Promise.all([resolveClassId(classLevel), resolveSubjectId(subject)]);

  const course = await prisma.course.create({
    data: { title, slug, classId, subjectId, status: "DRAFT" },
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

  const [classId, subjectId] = await Promise.all([resolveClassId(classLevel), resolveSubjectId(subject)]);

  await prisma.course.update({
    where: { id },
    data: { title, classId, subjectId, status },
  });

  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
}
