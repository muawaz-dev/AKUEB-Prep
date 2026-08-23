import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function CheckEmailPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-3 border border-black/10 dark:border-white/10 rounded-lg p-6 text-center">
          <h1 className="text-lg font-semibold">Check your email</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            We sent you a confirmation link. Click it to finish creating your account, then come back and log in.
          </p>
          <p className="text-xs text-black/40 dark:text-white/40">
            If you don&apos;t receive any email, you might already have an account - in that case,{" "}
            <Link href="/login" className="underline">
              log in
            </Link>{" "}
            or{" "}
            <Link href="/forgot-password" className="underline">
              reset your password
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
