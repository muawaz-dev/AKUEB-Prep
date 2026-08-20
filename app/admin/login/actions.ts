"use server";

import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminPassword } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function loginAction(formData: FormData) {
  // Two layers: per-IP (effective as long as the host's proxy sets a
  // trustworthy x-forwarded-for) and a global cap keyed on nothing the
  // caller supplies, so spoofing that header can't unlock unlimited guesses
  // against the single shared admin password - it can only fall back to
  // sharing this fixed, deployment-agnostic budget with every other guesser.
  if (!checkRateLimit("admin-login:global", 30, 15 * 60 * 1000)) {
    redirect("/admin/login?error=rate_limited");
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) {
    redirect("/admin/login?error=rate_limited");
  }

  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}
