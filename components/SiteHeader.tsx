import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/auth/actions";
import { ThemeToggle } from "./ThemeToggle";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="h-18 border-b border-white/10 sticky top-0 bg-brand text-white z-20">
      <div className="max-w-5xl mx-auto w-full h-full px-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          <Image
          src="/logo.png" 
          alt="Logo"
          width={400}
          height={400}
          className="h-24 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-base text-white/70 hidden sm:inline">{user.name || user.email}</span>
              <form action={logoutAction}>
                <button type="submit" className="text-base hover:underline">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-base hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-base bg-white text-brand hover:bg-white/90 rounded px-3 py-1.5 font-medium"
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
