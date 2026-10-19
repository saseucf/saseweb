import "server-only";
import { createAdminSupabase } from "@/lib/supabase-server";
import { publicLeaderboardEntries, queryLeaderboard } from "@/lib/leaderboard";

export async function loadPublicLeaderboard() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { entries: [], error: true };
  const { data, error } = await queryLeaderboard(createAdminSupabase());
  return { entries: publicLeaderboardEntries(data ?? []), error: Boolean(error) };
}
