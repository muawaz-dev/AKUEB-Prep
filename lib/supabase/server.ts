import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// For Server Components, Server Actions, and Route Handlers. Reads/writes
// the Supabase session via Next's cookie store, same mechanism our own
// admin/user session cookies already use elsewhere in this app.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render (not an Action/Route
            // Handler) - cookies can't be written there. Harmless as long
            // as proxy.ts is also refreshing the session on every request.
          }
        },
      },
    }
  );
}
