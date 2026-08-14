import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/adminSessionToken";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refresh the Supabase session on every request so student logins stay
  // valid across page loads (the JWT is short-lived and rotates via cookies).
  await supabase.auth.getClaims();

  // Admin gate - unrelated to Supabase Auth (single shared password, not a
  // multi-user login), same check this project has always used.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!isValidAdminSessionToken(process.env.ADMIN_SESSION_SECRET, adminToken)) {
      const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url));
      supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
