import { SiteHeader } from "@/components/SiteHeader";
import { resetPasswordAction } from "../auth/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          action={resetPasswordAction}
          className="w-full max-w-sm flex flex-col gap-4 border border-black/10 dark:border-white/10 rounded-lg p-6"
        >
          <h1 className="text-lg font-semibold">Choose a new password</h1>
          {error === "weak" ? (
            <p className="text-sm text-red-600">Password must be at least 8 characters.</p>
          ) : error === "same" ? (
            <p className="text-sm text-red-600">New password must be different from your current password.</p>
          ) : (
            error && <p className="text-sm text-red-600">That reset link isn&apos;t valid or has expired.</p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            New password (min 8 characters)
            <input
              type="password"
              name="password"
              required
              minLength={8}
              autoFocus
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
            />
          </label>
          <button
            type="submit"
            className="bg-black text-white dark:bg-white dark:text-black rounded px-3 py-2 text-sm font-medium"
          >
            Save new password
          </button>
        </form>
      </div>
    </div>
  );
}
