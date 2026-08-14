import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { forgotPasswordAction } from "../auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-4 border border-black/10 dark:border-white/10 rounded-lg p-6">
          <h1 className="text-lg font-semibold">Reset your password</h1>

          {sent ? (
            <p className="text-sm text-black/60 dark:text-white/60">
              If an account exists for that email, we&apos;ve sent a link to reset your password.
            </p>
          ) : (
            <form action={forgotPasswordAction} className="flex flex-col gap-4">
              {error && <p className="text-sm text-red-600">Please enter your email.</p>}
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
              <button
                type="submit"
                className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium"
              >
                Send reset link
              </button>
            </form>
          )}

          <p className="text-sm text-black/60 dark:text-white/60">
            <Link href="/login" className="underline">
              Back to log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
