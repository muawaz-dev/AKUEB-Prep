"use server";

import { redirect } from "next/navigation";
import { createAdminSession, verifyAdminPassword } from "@/lib/adminAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function loginAction(formData: FormData) {
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
