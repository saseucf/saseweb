import assert from "node:assert/strict";
import test from "node:test";
import { registerMember } from "../lib/member-registration";

const input = { email: " ANA@example.com ", password: "safe-password-123", first_name: "Ana", last_name: "Lee", major: "Physics", year: "2029", school: "UCF" };

test("registration creates a confirmed account and strips supplied privilege fields", async () => {
  const attempts: string[] = [];
  const result = await registerMember({ ...input, role: "admin", is_admin: true, app_metadata: { role: "admin" } }, "192.0.2.1", {
    claimAttempt: async key => { attempts.push(key); return { data: true, error: null }; },
    createUser: async user => {
      assert.equal(attempts.length, 2);
      assert.equal(user.email, "ana@example.com");
      assert.equal(user.email_confirm, true);
      assert.equal(user.password, input.password);
      assert.equal("role" in user, false);
      assert.equal("app_metadata" in user, false);
      assert.equal("role" in user.user_metadata, false);
      assert.equal("is_admin" in user.user_metadata, false);
      return { error: null };
    },
  });
  assert.equal(result.status, 201);
  assert.equal(attempts.some(key => key.includes(input.email) || key.includes("192.0.2.1")), false);
});

test("invalid input, denied attempts, and unavailable limits never create accounts", async () => {
  let created = 0;
  const createUser = async () => { created++; return { error: null }; };
  await assert.rejects(registerMember({ ...input, password: "bad" }, undefined, { claimAttempt: async () => { throw new Error("Should not be reached"); }, createUser }));
  for (const [data, error, status] of [[false, null, 429], [true, { code: "missing_rpc" }, 503], [null, null, 429]] as const) {
    const result = await registerMember(input, undefined, { claimAttempt: async () => ({ data, error }), createUser });
    assert.equal(result.status, status);
  }
  assert.equal(created, 0);
});

test("an existing-account rejection cannot issue a session or change that account", async () => {
  const result = await registerMember(input, undefined, {
    claimAttempt: async () => ({ data: true, error: null }),
    createUser: async () => ({ error: { code: "email_exists" } }),
  });
  assert.equal(result.status, 400);
  assert.equal("success" in result, false);
  assert.equal("session" in result, false);
});
