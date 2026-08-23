import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Whether anyone's logged in, resolved client-side so pages that embed
// per-user UI (e.g. QuestionBankFilters' "Solved" filter) don't need their
// own getCurrentUser() call and lose ISR caching - see QuestionList's
// /api/solved-status for the same pattern applied to per-question data.
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ loggedIn: !!user });
}
