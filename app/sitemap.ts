import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { classLevelToSlug, slugify, MIN_QUESTIONS } from "@/lib/slugs";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const questions = await prisma.question.findMany({
    where: { status: "PUBLISHED" },
    select: {
      pastPaper: true,
      updatedAt: true,
      class: { select: { level: true } },
      subject: { select: { name: true } },
      chapter: { select: { id: true, title: true } },
    },
  });

  // Home and the question-bank index aggregate every subject, so their
  // freshness follows whatever question was touched most recently.
  const siteLastModified = questions.reduce<Date | undefined>(
    (max, q) => (!max || q.updatedAt > max ? q.updatedAt : max),
    undefined
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: siteLastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/question-bank`, lastModified: siteLastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/courses`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/terms-of-service`, changeFrequency: "yearly", priority: 0.1 },
  ];

  type ChapterInfo = { title: string; count: number; lastModified: Date };
  type PaperInfo = { count: number; lastModified: Date };
  type Group = {
    classLevel: number;
    subjectName: string;
    lastModified: Date;
    chapterCounts: Map<string, ChapterInfo>;
    paperCounts: Map<string, PaperInfo>;
  };
  const groups = new Map<string, Group>();
  const classLastModified = new Map<number, Date>();

  for (const q of questions) {
    const key = `${q.class.level}::${q.subject.name}`;
    if (!groups.has(key)) {
      groups.set(key, {
        classLevel: q.class.level,
        subjectName: q.subject.name,
        lastModified: q.updatedAt,
        chapterCounts: new Map(),
        paperCounts: new Map(),
      });
    }
    const group = groups.get(key)!;
    if (q.updatedAt > group.lastModified) group.lastModified = q.updatedAt;

    const classMax = classLastModified.get(q.class.level);
    if (!classMax || q.updatedAt > classMax) classLastModified.set(q.class.level, q.updatedAt);

    if (q.chapter) {
      const existing = group.chapterCounts.get(q.chapter.id);
      group.chapterCounts.set(q.chapter.id, {
        title: q.chapter.title,
        count: (existing?.count ?? 0) + 1,
        lastModified: existing && existing.lastModified > q.updatedAt ? existing.lastModified : q.updatedAt,
      });
    }
    if (q.pastPaper) {
      const existing = group.paperCounts.get(q.pastPaper);
      group.paperCounts.set(q.pastPaper, {
        count: (existing?.count ?? 0) + 1,
        lastModified: existing && existing.lastModified > q.updatedAt ? existing.lastModified : q.updatedAt,
      });
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
        lastModified: classLastModified.get(group.classLevel),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    dynamicRoutes.push({
      url: `${SITE_URL}/question-bank/${classSlug}/${subjectSlug}`,
      lastModified: group.lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    for (const { title, count, lastModified } of group.chapterCounts.values()) {
      if (count < MIN_QUESTIONS) continue;
      dynamicRoutes.push({
        url: `${SITE_URL}/question-bank/${classSlug}/${subjectSlug}/${slugify(title)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const [pastPaper, { count, lastModified }] of group.paperCounts.entries()) {
      if (count < MIN_QUESTIONS) continue;
      dynamicRoutes.push({
        url: `${SITE_URL}/question-bank/${classSlug}/${subjectSlug}/past-papers/${slugify(pastPaper)}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}
