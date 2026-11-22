import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Same Auth users as SASE; hackathonApi selects the isolated hackathon schema. */
export function createHackathonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Configure the existing SASE Supabase project.");
  return createClient(url, key, {
    // Separate site sessions; the same email/password/provider account works on both.
    auth: { storageKey: "hackathon-auth", persistSession: true, autoRefreshToken: true },
  });
}
