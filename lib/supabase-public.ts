import { createClient } from "@supabase/supabase-js";

// Plain, cookie-less Supabase client for server-rendered pages that only
// read publicly-accessible data (RLS policies with USING (true)). Unlike
// createServerSupabase(), this never touches next/headers' cookies(), so
// pages using it stay eligible for static rendering / ISR instead of being
// forced into dynamic, per-request rendering.
export function createPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    { auth: { persistSession: false } }
  );
}
