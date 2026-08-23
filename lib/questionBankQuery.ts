import type { Prisma } from "@/app/generated/prisma/client";
import type { Difficulty } from "@/app/generated/prisma/enums";

export type QuestionBankParams = {
  classId?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  sloId?: string | null;
  difficulty?: string | null;
  pastPaper?: string | null;
  // "OBJECTIVE" = MCQ only, "SUBJECTIVE" = every other question type - matches
  // how AKU-EB itself splits an exam paper, not a data model distinction.
  questionType?: string | null;
  // "true"/"false" - whether the current user has ever fully solved the
  // question (QuestionAttempt.solved). Unlike every other filter this one
  // is per-user, so it needs `userId` (see buildWhere) - always resolved
  // server-side from the session, never from a client-supplied value.
  solved?: string | null;
  sort?: string | null;
};

// Shared by app/(main)/question-bank/page.tsx (initial server render) and
// app/api/questions/route.ts ("load more") so the two never drift apart -
// same filters always produce the same result set either way.
//
// `userId` is only relevant for params.solved, and is deliberately a
// separate argument rather than part of QuestionBankParams: every other
// field here is safe to take straight from the URL, but a solved-status
// filter has to be tied to whoever's actually logged in, not whatever the
// URL happens to say. Pass null/omit when solved isn't being filtered (the
// common case) or when nobody's logged in - see each page's conditional
// getCurrentUser() call, which only runs (and only then opts that request
// out of the ISR cache other filters get to keep) when params.solved is set.
export function buildWhere(params: QuestionBankParams, userId?: string | null): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = { status: "PUBLISHED" };
  if (params.classId) where.classId = params.classId;
  if (params.subjectId) where.subjectId = params.subjectId;
  if (params.chapterId) where.chapterId = params.chapterId;
  if (params.topicId) where.topicId = params.topicId;
  if (params.sloId) where.sloId = params.sloId;
  if (params.difficulty) where.difficulty = params.difficulty as Difficulty;
  if (params.pastPaper) where.pastPaper = params.pastPaper;
  if (params.questionType === "OBJECTIVE") where.type = "MCQ";
  else if (params.questionType === "SUBJECTIVE") where.type = { not: "MCQ" };
  if (params.solved === "true") {
    // Logged out ⇒ nothing's ever been solved - match nothing rather than
    // silently ignoring the filter.
    if (userId) where.attempts = { some: { userId, solved: true } };
    else where.id = { in: [] };
  } else if (params.solved === "false") {
    // Logged out ⇒ every question already qualifies as "not solved" - no
    // filtering needed.
    if (userId) where.attempts = { none: { userId, solved: true } };
  }
  return where;
}

export function buildOrderBy(sort?: string | null): Prisma.QuestionOrderByWithRelationInput {
  return sort === "oldest"
    ? { createdAt: "asc" }
    : sort === "easiest"
      ? { difficulty: "asc" }
      : sort === "hardest"
        ? { difficulty: "desc" }
        : { createdAt: "desc" };
}

// Query-string form of QuestionBankParams, used to hand the exact same
// filter set to the client (QuestionList) for its "load more" requests -
// leaves out anything unset rather than writing empty params.
export function toQueryString(params: QuestionBankParams): string {
  const qs = new URLSearchParams();
  if (params.classId) qs.set("classId", params.classId);
  if (params.subjectId) qs.set("subjectId", params.subjectId);
  if (params.chapterId) qs.set("chapterId", params.chapterId);
  if (params.topicId) qs.set("topicId", params.topicId);
  if (params.sloId) qs.set("sloId", params.sloId);
  if (params.difficulty) qs.set("difficulty", params.difficulty);
  if (params.pastPaper) qs.set("pastPaper", params.pastPaper);
  if (params.questionType) qs.set("questionType", params.questionType);
  if (params.solved) qs.set("solved", params.solved);
  if (params.sort) qs.set("sort", params.sort);
  return qs.toString();
}
