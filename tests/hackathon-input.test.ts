import assert from "node:assert/strict";
import test from "node:test";
import { parseHackathonInput } from "../lib/hackathon-input";

test("hackathons can be saved before Discord setup and IDs retain full precision", () => {
  const input = { name: " LumaHacks ", slug: "lumahacks-2028", discord_channel_id: "", discord_role_id: "" };
  assert.equal(parseHackathonInput(input).discord_role_id, null);
  const id = "12345678901234567890";
  assert.deepEqual(parseHackathonInput({ ...input, discord_role_id: id, discord_channel_id: ` ${id} ` }), {
    name: "LumaHacks", slug: "lumahacks-2028", discord_role_id: id, discord_channel_id: id,
  });
});

test("invalid slugs and Discord mentions are rejected before saving", () => {
  const input = { name: "LumaHacks", slug: "lumahacks-2028" };
  for (const slug of ["", "With Spaces", "../admin", "double--hyphen"]) {
    assert.throws(() => parseHackathonInput({ ...input, slug }));
  }
  for (const id of ["@everyone", "<#123456789012345678>", "123", "123456789012345678901"]) {
    assert.throws(() => parseHackathonInput({ ...input, discord_role_id: id }));
    assert.throws(() => parseHackathonInput({ ...input, discord_channel_id: id }));
  }
  assert.throws(() => parseHackathonInput({ ...input, name: " " }));
});
