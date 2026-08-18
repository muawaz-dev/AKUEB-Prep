import { redirect } from "next/navigation";
import Link from "next/link";
import { clearAdminSession, isAdminAuthenticated } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return <>{children}</>;
  }

  async function logout() {
    "use server";
    await clearAdminSession();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r border-black/10 dark:border-white/10 p-4 flex flex-col gap-6">
        <div className="font-semibold">AKUEB Admin</div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/admin/questions" className="hover:underline">
            Questions
          </Link>
          <Link href="/admin/courses" className="hover:underline">
            Courses
          </Link>
        </nav>
        <form action={logout} className="mt-auto">
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Log out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6 max-w-4xl">{children}</main>
    </div>
  );
}
