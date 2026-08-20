import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { classLevelToSlug, slugify, MIN_QUESTIONS } from "@/lib/slugs";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/question-bank`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/courses`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms-of-service`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const questions = await prisma.question.findMany({
    where: { status: "PUBLISHED" },
    select: {
      pastPaper: true,
      class: { select: { level: true } },
      subject: { select: { name: true } },
      chapter: { select: { id: true, title: true } },
    },
  });

  type Group = {
    classLevel: number;
    subjectName: string;
    chapterCounts: Map<string, { title: string; count: number }>;
    paperCounts: Map<string, number>;
  };
  const groups = new Map<string, Group>();

  for (const q of questions) {
    const key = `${q.class.level}::${q.subject.name}`;
    if (!groups.has(key)) {
      groups.set(key, {
        classLevel: q.class.level,
        subjectName: q.subject.name,
        chapterCounts: new Map(),
        paperCounts: new Map(),
      });
    }
    const group = groups.get(key)!;
    if (q.chapter) {
      const existing = group.chapterCounts.get(q.chapter.id);
      group.chapterCounts.set(q.chapter.id, { title: q.chapter.title, count: (existing?.count ?? 0) + 1 });
    }
    if (q.pastPaper) {
      group.paperCounts.set(q.pastPaper, (group.paperCounts.get(q.pastPaper) ?? 0) + 1);
    }
  }

  const dynamicRoutes: MetadataRoute.Sitemap = [];
  const seenClassSlugs = new Set<string>();
  for (const group of groups.values()) {
    const classSlug = classLevelToSlug(group.classLevel);
    const subjectSlug = slugify(group.subjectName);

    if (!seenClassSlugs.has(classSlug)) {
      seenClassSlugs.add(classSlug);
      dynamicRoutes.push({
        url: `${SITE_URL}/question-bank/${classSlug}`,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    dynamicRoutes.push({
      url: `${SITE_URL}/question-bank/${classSlug}/${subjectSlug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    for (const { title, count } of group.chapterCounts.values()) {
      if (count < MIN_QUESTIONS) continue;
      dynamicRoutes.push({
        url: `${SITE_URL}/question-bank/${classSlug}/${subjectSlug}/${slugify(title)}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const [pastPaper, count] of group.paperCounts.entries()) {
      if (count < MIN_QUESTIONS) continue;
      dynamicRoutes.push({
        url: `${SITE_URL}/question-bank/${classSlug}/${subjectSlug}/past-papers/${slugify(pastPaper)}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}
