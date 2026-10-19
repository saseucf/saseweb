import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { isLeaderboardMember, queryLeaderboard, queryMembersAhead, rankLeaderboard, type LeaderboardProfile } from "../lib/leaderboard";

const profile = (id: string, points: number, role = "member"): LeaderboardProfile => ({ id, first_name: id, last_name: "Member", total_points: points, role });

test("only members are eligible, regardless of an administrator's points or role capitalization", () => {
  assert.equal(isLeaderboardMember("member"), true);
  for (const role of ["admin", "ADMIN", " Admin ", "administrator", "", null, undefined]) assert.equal(isLeaderboardMember(role), false);
  assert.deepEqual(rankLeaderboard([profile("admin", 1000, "admin"), profile("member", 5)]).map(entry => entry.id), ["member"]);
});

test("administrators never occupy top-ten slots; ties have deterministic order and shared ranks", () => {
  const profiles = [profile("admin-1", 999, "admin"), profile("admin-2", 999, "admin"), ...Array.from({ length: 15 }, (_, index) => profile(`m-${String(index).padStart(2, "0")}`, 100 - Math.floor(index / 2)))].reverse();
  const originalOrder = profiles.map(entry => entry.id);
  const entries = rankLeaderboard(profiles);
  assert.equal(entries.length, 10);
  assert.deepEqual(entries.map(entry => entry.id), Array.from({ length: 10 }, (_, index) => `m-${String(index).padStart(2, "0")}`));
  assert.deepEqual(entries.map(entry => entry.rank), [1, 1, 3, 3, 5, 5, 7, 7, 9, 9]);
  assert.deepEqual(profiles.map(entry => entry.id), originalOrder);
});

test("empty standings and members with zero points render consistent ranks", () => {
  assert.deepEqual(rankLeaderboard([]), []);
  assert.deepEqual(rankLeaderboard([profile("admin", 0, "admin")]), []);
  const entries = rankLeaderboard([{ ...profile("a", 0), first_name: null, last_name: null, total_points: null }, profile("b", 0)]);
  assert.deepEqual(entries.map(entry => entry.rank), [1, 1]);
  assert.equal(entries[0].name, "SASE member");
  assert.equal(entries[0].total_points, 0);
  assert.equal("role" in entries[0], false);
});

test("database query filters members before limiting and selects no contact information", async () => {
  const client = createClient("https://leaderboard-test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("role"), "eq.member");
      assert.equal(url.searchParams.get("limit"), "10");
      assert.equal(url.searchParams.get("order"), "total_points.desc,id.asc");
      assert.equal(url.searchParams.get("select"), "id,first_name,last_name,total_points,role");
      return Response.json([profile("member", 10)]);
    } },
  });
  const result = await queryLeaderboard(client);
  assert.equal(result.error, null);
  assert.equal(result.data?.length, 1);
});

test("personal rank counts only members with strictly more points so admins and tied scores do not inflate it", async () => {
  const profiles = [profile("admin", 500, "admin"), profile("first", 20), profile("tied-a", 15), profile("tied-b", 15), profile("last", 5)];
  const client = createClient("https://leaderboard-test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, options) => {
      const url = new URL(String(input));
      assert.equal(options?.method, "HEAD");
      assert.equal(url.searchParams.get("role"), "eq.member");
      assert.equal(url.searchParams.get("total_points"), "gt.15");
      const ahead = profiles.filter(entry => entry.role === "member" && (entry.total_points ?? 0) > 15).length;
      return new Response(null, { headers: { "Content-Range": `*/${ahead}` } });
    } },
  });
  const result = await queryMembersAhead(client, 15);
  assert.equal(result.error, null);
  assert.equal((result.count ?? 0) + 1, 2);
  assert.equal(rankLeaderboard(profiles).find(entry => entry.id === "tied-a")?.rank, 2);
});
