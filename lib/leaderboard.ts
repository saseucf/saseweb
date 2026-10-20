import type { SupabaseClient } from "@supabase/supabase-js";
import { isMemberProfileRole, MEMBER_PROFILE_ROLES } from "@/lib/member-roles";

export const LEADERBOARD_SIZE = 10;

export type LeaderboardProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  total_points: number | null;
  role: string;
};

export function isLeaderboardMember(role: unknown) {
  return isMemberProfileRole(role);
}

export function queryLeaderboard(client: SupabaseClient) {
  return client.from("profiles")
    .select("id, first_name, last_name, total_points, role")
    .in("role", [...MEMBER_PROFILE_ROLES])
    .order("total_points", { ascending: false })
    .order("id")
    .limit(LEADERBOARD_SIZE);
}

export function queryMembersAhead(client: SupabaseClient, points: number) {
  return client.from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", [...MEMBER_PROFILE_ROLES])
    .gt("total_points", points);
}

export function rankLeaderboard(profiles: readonly LeaderboardProfile[]) {
  const members = profiles.filter(profile => isLeaderboardMember(profile.role))
    .slice()
    .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, LEADERBOARD_SIZE);
  return members.map((profile) => ({
    id: profile.id,
    name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "SASE member",
    total_points: profile.total_points ?? 0,
    rank: members.findIndex(member => (member.total_points ?? 0) === (profile.total_points ?? 0)) + 1,
  }));
}

export type PublicLeaderboardEntry = { name: string; total_points: number; rank: number };

export function publicLeaderboardEntries(profiles: readonly LeaderboardProfile[]): PublicLeaderboardEntry[] {
  return rankLeaderboard(profiles).map(({ name, total_points, rank }) => ({ name, total_points, rank }));
}
