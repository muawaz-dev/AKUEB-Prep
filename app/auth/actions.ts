"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=missing");
  }
  if (password.length < 8) {
    redirect("/signup?error=weak");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || undefined },
      emailRedirectTo: `${origin}/auth/confirm?next=/courses`,
    },
  });

  if (error) {
    redirect(`/signup?error=${error.code === "user_already_exists" ? "exists" : "unknown"}`);
  }

  redirect("/signup/check-email");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=1");
  }

  redirect("/courses");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/courses");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=1");
  }
  redirect(data.url);
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    redirect("/forgot-password?error=1");
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  // Don't reveal whether the email exists - always show the same
  // confirmation regardless of the result.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect("/reset-password?error=weak");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=1");
  }

  redirect("/courses");
}
