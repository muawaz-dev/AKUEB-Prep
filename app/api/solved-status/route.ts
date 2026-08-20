import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSolvedIds } from "@/lib/solvedStatus";

// Called client-side once a question list has mounted, to resolve which of
// its (server-rendered, logged-out-safe) questions the current user has
// already solved - keeps the page itself free of any per-user data so it
// stays cacheable. See components/question-bank/QuestionList.tsx.
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ solvedIds: [] });

  const solvedIds = await getSolvedIds(user.id, ids);
  return NextResponse.json({ solvedIds });
}
