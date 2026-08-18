export type FilterSlo = { id: string; code: string };
export type FilterTopic = { id: string; code: string; title: string; slos: FilterSlo[] };
export type FilterChapter = { id: string; title: string; orderIndex: number; topics: FilterTopic[] };
export type FilterSubject = { id: string; name: string; chapters: FilterChapter[] };
export type FilterClass = { id: string; level: number; subjects: FilterSubject[] };

type QuestionForTree = {
  class: { id: string; level: number };
  subject: { id: string; name: string };
  chapter: { id: string; title: string; orderIndex: number } | null;
  topic: { id: string; code: string; title: string; orderIndex: number } | null;
  slo: { id: string; code: string; orderIndex: number } | null;
};

// Builds the Class -> Subject -> Chapter -> Topic -> SLO filter option tree
// purely from questions that actually exist (status PUBLISHED, passed in by
// the caller), so no option offered on the public question-bank page is ever
// a dead end. A question only tagged down to class+subject (no chapter yet)
// still makes its class/subject show up, just with nothing to drill into
// below that. Ordered by each level's own real orderIndex column, not by
// parsing the display text/codes.
export function buildFilterTree(questions: QuestionForTree[]): FilterClass[] {
  const classMap = new Map<
    string,
    {
      level: number;
      subjects: Map<
        string,
        {
          name: string;
          chapters: Map<
            string,
            {
              title: string;
              orderIndex: number;
              topics: Map<string, { code: string; title: string; orderIndex: number; slos: Map<string, { code: string; orderIndex: number }> }>;
            }
          >;
        }
      >;
    }
  >();

  for (const q of questions) {
    if (!classMap.has(q.class.id)) classMap.set(q.class.id, { level: q.class.level, subjects: new Map() });
    const subjectMap = classMap.get(q.class.id)!.subjects;

    if (!subjectMap.has(q.subject.id)) subjectMap.set(q.subject.id, { name: q.subject.name, chapters: new Map() });
    if (!q.chapter) continue;
    const chapterMap = subjectMap.get(q.subject.id)!.chapters;

    if (!chapterMap.has(q.chapter.id)) {
      chapterMap.set(q.chapter.id, { title: q.chapter.title, orderIndex: q.chapter.orderIndex, topics: new Map() });
    }
    if (!q.topic) continue;
    const topicMap = chapterMap.get(q.chapter.id)!.topics;

    if (!topicMap.has(q.topic.id)) {
      topicMap.set(q.topic.id, { code: q.topic.code, title: q.topic.title, orderIndex: q.topic.orderIndex, slos: new Map() });
    }
    if (!q.slo) continue;
    topicMap.get(q.topic.id)!.slos.set(q.slo.id, { code: q.slo.code, orderIndex: q.slo.orderIndex });
  }

  return Array.from(classMap.entries())
    .sort(([, a], [, b]) => a.level - b.level)
    .map(([id, c]) => ({
      id,
      level: c.level,
      subjects: Array.from(c.subjects.entries())
        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        .map(([subjectId, s]) => ({
          id: subjectId,
          name: s.name,
          chapters: Array.from(s.chapters.entries())
            .sort(([, a], [, b]) => a.orderIndex - b.orderIndex)
            .map(([chapterId, ch]) => ({
              id: chapterId,
              title: ch.title,
              orderIndex: ch.orderIndex,
              topics: Array.from(ch.topics.entries())
                .sort(([, a], [, b]) => a.orderIndex - b.orderIndex)
                .map(([topicId, t]) => ({
                  id: topicId,
                  code: t.code,
                  title: t.title,
                  slos: Array.from(t.slos.entries())
                    .sort(([, a], [, b]) => a.orderIndex - b.orderIndex)
                    .map(([sloId, s]) => ({ id: sloId, code: s.code })),
                })),
            })),
        })),
    }));
}

type ChapterForTree = {
  id: string;
  title: string;
  orderIndex: number;
  class: { id: string; level: number };
  subject: { id: string; name: string };
  topics: { id: string; code: string; title: string; orderIndex: number; slos: { id: string; code: string; orderIndex: number }[] }[];
};

// Same output shape as buildFilterTree, but sourced from the full curriculum
// (every Chapter/Topic/Slo, any status) rather than from questions - used by
// the admin picker, which needs to show everything available for tagging/
// authoring, not just what's already been used.
export function buildCurriculumTree(chapters: ChapterForTree[]): FilterClass[] {
  const classMap = new Map<string, { level: number; subjects: Map<string, { name: string; chapters: ChapterForTree[] }> }>();

  for (const ch of chapters) {
    if (!classMap.has(ch.class.id)) classMap.set(ch.class.id, { level: ch.class.level, subjects: new Map() });
    const subjectMap = classMap.get(ch.class.id)!.subjects;
    if (!subjectMap.has(ch.subject.id)) subjectMap.set(ch.subject.id, { name: ch.subject.name, chapters: [] });
    subjectMap.get(ch.subject.id)!.chapters.push(ch);
  }

  return Array.from(classMap.entries())
    .sort(([, a], [, b]) => a.level - b.level)
    .map(([id, c]) => ({
      id,
      level: c.level,
      subjects: Array.from(c.subjects.entries())
        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        .map(([subjectId, s]) => ({
          id: subjectId,
          name: s.name,
          chapters: [...s.chapters]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((ch) => ({
              id: ch.id,
              title: ch.title,
              orderIndex: ch.orderIndex,
              topics: [...ch.topics]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((t) => ({
                  id: t.id,
                  code: t.code,
                  title: t.title,
                  slos: [...t.slos].sort((a, b) => a.orderIndex - b.orderIndex).map((s) => ({ id: s.id, code: s.code })),
                })),
            })),
        })),
    }));
}
