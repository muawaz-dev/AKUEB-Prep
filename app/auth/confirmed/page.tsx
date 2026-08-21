import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

// Landed on directly from app/auth/confirm/route.ts after a signup
// confirmation link verifies - gives an explicit "it worked" moment instead
// of silently dropping the student onto the dashboard, which otherwise looks
// identical to a link that did nothing (see app/reset-password/page.tsx for
// the recovery equivalent - that flow already lands on a self-explanatory
// "choose a new password" form, so it doesn't need this extra step).
export default async function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-3 border border-black/10 dark:border-white/10 rounded-lg p-6 text-center">
          <h1 className="text-lg font-semibold">Email verified</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Your account is confirmed and you&apos;re signed in - you&apos;re all set.
          </p>
          <Link
            href={next ?? "/"}
            className="mt-1 bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium"
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
