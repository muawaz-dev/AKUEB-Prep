// Server-side DB lookups for the public question-bank pages
// (/question-bank/[classLevel]/[subject]/...). Pure slug string helpers live
// in lib/slugFormat.ts (re-exported below) so Client Components can import
// just those without pulling in Prisma.

import { prisma } from "./prisma";
import { slugToClassLevel, findBySlug } from "./slugFormat";

export * from "./slugFormat";

// Resolves just the /question-bank/[classLevel] segment - used by that
// page itself, ahead of any subject being chosen.
export async function resolveClass(classLevelSlug: string) {
  const level = slugToClassLevel(classLevelSlug);
  if (level === null) return null;
  return prisma.class.findUnique({ where: { level } });
}

// Shared by every /question-bank/[classLevel]/[subject]/... page - resolves
// the two leading URL segments to real Class/Subject rows once, so each
// page's own resolver only has to handle what's specific to it (a chapter,
// a past paper).
export async function resolveClassSubject(classLevelSlug: string, subjectSlug: string) {
  const level = slugToClassLevel(classLevelSlug);
  if (level === null) return null;
  const cls = await prisma.class.findUnique({ where: { level } });
  if (!cls) return null;
  const subjects = await prisma.subject.findMany();
  const subject = findBySlug(subjects, subjectSlug, (s) => s.name);
  if (!subject) return null;
  return { cls, subject };
}
