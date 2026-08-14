import { loginAction } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        action={loginAction}
        className="w-full max-w-sm flex flex-col gap-4 border border-black/10 dark:border-white/10 rounded-lg p-6"
      >
        <h1 className="text-lg font-semibold">Admin login</h1>
        {error === "rate_limited" ? (
          <p className="text-sm text-red-600">Too many attempts. Try again in a few minutes.</p>
        ) : (
          error && <p className="text-sm text-red-600">Incorrect password.</p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
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
    </div>
  );
}
