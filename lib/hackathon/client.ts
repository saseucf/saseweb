import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Dedicated portal project. Never falls back to the SASE project's credentials. */
export function createHackathonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_HACKATHON_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_HACKATHON_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Configure the standalone hackathon Supabase project.");
  return createClient(url, key, {
    auth: { storageKey: "hackathon-auth", persistSession: true, autoRefreshToken: true },
  });
}
