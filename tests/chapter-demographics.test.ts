import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { aggregateMemberMajors, queryMemberMajors } from "../lib/chapter-demographics";

test("major queries include existing users and new members and select only aggregate input", async () => {
  const client = createClient("https://demographics-test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async input => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("role"), "in.(member,user)");
      assert.equal(url.searchParams.get("select"), "major");
      assert.equal(url.searchParams.get("offset"), "1000");
      assert.equal(url.searchParams.get("limit"), "1000");
      return Response.json([{ major: "Physics" }, { major: "Computer Science" }, { major: "Physics" }]);
    } },
  });
  const result = await queryMemberMajors(client, 1000);
  assert.equal(result.error, null);
  assert.deepEqual(aggregateMemberMajors(result.data ?? []), [{ name: "Physics", value: 2 }, { name: "Computer Science", value: 1 }]);
});
