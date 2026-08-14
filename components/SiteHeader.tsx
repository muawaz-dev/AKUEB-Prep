import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/auth/actions";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 dark:border-white/10 sticky top-0 bg-background z-10">
      <div className="max-w-5xl mx-auto w-full px-6 h-14 flex items-center justify-between">
        <Link href="/courses" className="font-semibold">
          AKUEB Maths
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-black/60 dark:text-white/60 hidden sm:inline">
                {user.name || user.email}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="text-sm hover:underline">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-black text-white dark:bg-white dark:text-black rounded px-3 py-1.5 font-medium"
              >
                Sign up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
