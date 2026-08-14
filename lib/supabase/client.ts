import { createBrowserClient } from "@supabase/ssr";

// For any client-side use. The app's auth flows run through Server Actions
// (see app/auth/actions.ts) to match the rest of the codebase, so this is
// mostly here for completeness / future client-side needs.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
