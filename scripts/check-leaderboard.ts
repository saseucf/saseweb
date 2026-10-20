// Read-only verification against the configured Supabase project. Prints counts
// only; member names, emails, and credentials never appear in the output.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { isLeaderboardMember, queryLeaderboard, queryMembersAhead, rankLeaderboard } from "../lib/leaderboard";
import { aggregateMemberMajors, queryMemberMajors } from "../lib/chapter-demographics";

async function main() {
  config({ path: ".env.local", quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure Supabase URL and service-role key before running this read-only check.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await queryLeaderboard(client);
  if (result.error) throw new Error(`Leaderboard query failed (${result.error.code || "connection error"}).`);
  if (result.data.some(profile => !isLeaderboardMember(profile.role))) throw new Error("Ineligible profile appeared in the database result.");
  const entries = rankLeaderboard(result.data);
  if (entries.length > 10 || entries.length !== result.data.length) throw new Error("Leaderboard returned inconsistent results.");
  for (const entry of entries) {
    const ahead = await queryMembersAhead(client, entry.total_points);
    if (ahead.error || ahead.count === null || ahead.count + 1 !== entry.rank) throw new Error("Membership rank does not match leaderboard rank.");
  }
  const majors: { major: string | null }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await queryMemberMajors(client, offset);
    if (page.error) throw new Error("Demographics query failed.");
    majors.push(...page.data);
    if (page.data.length < 1000) break;
  }
  const groups = aggregateMemberMajors(majors);
  console.log(JSON.stringify({ ok: true, displayedMembers: entries.length, administratorsIncluded: 0, membershipRanksMatch: true, demographicProfiles: majors.length, membersWithMajor: groups.reduce((sum, group) => sum + group.value, 0), majorGroups: groups.length }));
}
main().catch(() => {
  console.error("Read-only leaderboard verification failed. Check database configuration, connectivity, and schema. No data was changed.");
  process.exitCode = 1;
});
