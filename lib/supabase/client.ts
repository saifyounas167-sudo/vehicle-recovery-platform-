import { createBrowserClient } from "@supabase/ssr";

// These NEXT_PUBLIC values are embedded during the Vercel BUILD, not fetched
// from the deployed function's runtime environment.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasBrowserSupabaseConfig(): boolean {
  return Boolean(url?.trim() && publishableKey?.trim());
}

export function createClient() {
  if (!hasBrowserSupabaseConfig()) {
    throw new Error("Supabase browser configuration missing from build-time public environment.");
  }
  return createBrowserClient(url!, publishableKey!);
}
