import { createClient } from "@supabase/supabase-js";

// Anonymous, cookie-free client for public read-only storefront queries
// (safe to call from any Server Component; no session/auth required).
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
