import LeaderboardLive from "@/components/leaderboard-live";
import { loadPublicLeaderboard } from "@/lib/leaderboard-server";

export default async function Leaderboard() {
  const { entries, error } = await loadPublicLeaderboard();
  return <LeaderboardLive initialEntries={entries} initialError={error} />;
}
