import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSolvedIds } from "@/lib/solvedStatus";
import { toQuestionDto } from "@/lib/questionDto";
import { buildWhere, buildOrderBy } from "@/lib/questionBankQuery";

const DEFAULT_TAKE = 15;

// "Load more" for every question list (the plain /question-bank explorer and
// every /question-bank/[classLevel]/[subject]/... page) - same where/orderBy
// as the page's own initial server-rendered batch (see lib/questionBankQuery.ts),
// just with an offset. Also resolves solved-status for whatever it returns,
// so QuestionList doesn't need a second round-trip for newly-loaded questions.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Resolved unconditionally (this route already isn't ISR-cached like the
  // pages it backs) - reused below both for the solved-status filter and
  // for resolving each returned question's own solved badge.
  const user = await getCurrentUser();

  const where = buildWhere(
    {
      classId: params.get("classId"),
      subjectId: params.get("subjectId"),
      chapterId: params.get("chapterId"),
      topicId: params.get("topicId"),
      sloId: params.get("sloId"),
      difficulty: params.get("difficulty"),
      pastPaper: params.get("pastPaper"),
      questionType: params.get("questionType"),
      solved: params.get("solved"),
    },
    user?.id
  );
  const orderBy = buildOrderBy(params.get("sort"));

  const offset = Math.max(0, Number(params.get("offset")) || 0);
  const take = Math.max(1, Math.min(50, Number(params.get("take")) || DEFAULT_TAKE));

  const rows = await prisma.question.findMany({
    where,
    orderBy,
    skip: offset,
    take: take + 1,
    include: { class: true, subject: true, chapter: true, topic: true, slo: true },
  });

  const hasMore = rows.length > take;
  const questions = rows.slice(0, take).map(toQuestionDto);
  const solvedIds = user ? await getSolvedIds(user.id, questions.map((q) => q.id)) : [];

  return NextResponse.json({ questions, hasMore, solvedIds });
}
