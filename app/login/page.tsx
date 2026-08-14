import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { loginAction } from "../auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-4 border border-black/10 dark:border-white/10 rounded-lg p-6">
          <h1 className="text-lg font-semibold">Log in</h1>

          <OAuthButtons />

          <div className="flex items-center gap-3 text-xs text-black/40 dark:text-white/40">
            <div className="flex-1 border-t border-black/10 dark:border-white/10" />
            or
            <div className="flex-1 border-t border-black/10 dark:border-white/10" />
          </div>

          <form action={loginAction} className="flex flex-col gap-4">
            {error && <p className="text-sm text-red-600">Incorrect email or password.</p>}
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                name="email"
                required
                autoFocus
                className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Password
              <input
                type="password"
                name="password"
                required
                className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
              />
            </label>
            <button
              type="submit"
              className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium"
            >
              Log in
            </button>
          </form>

          <p className="text-sm text-black/60 dark:text-white/60">
            <Link href="/forgot-password" className="underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            No account yet?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
