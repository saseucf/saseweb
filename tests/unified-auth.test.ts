import assert from "node:assert/strict";
import test from "node:test";
import { createMemberFromProfile, parseJoinProfile, passwordNextStep, profileIsComplete, skipsProfileQuestions } from "../lib/unified-auth";
import { getSafeAuthRedirect } from "../lib/auth-redirect";

const profile = { first_name: " Ana ", last_name: "de la Cruz", major: "Physics", year: "2029", school: "University of Central Florida" };

test("Google and Discord accounts skip profile questions, including linked accounts", () => {
  for (const provider of ["google", "discord"]) {
    assert.equal(skipsProfileQuestions({ app_metadata: { provider } }), true);
    assert.equal(skipsProfileQuestions({ app_metadata: { provider: "email", providers: ["email", provider] } }), true);
  }
});

test("email accounts still require profile setup and editable metadata cannot bypass it", () => {
  for (const app_metadata of [{}, { provider: "email" }, { providers: ["email"] }, { providers: "google" }, { provider: "github" }]) {
    const user = { app_metadata, user_metadata: { provider: "google", providers: ["discord"] } };
    assert.equal(skipsProfileQuestions(user), false);
  }
});

test("only invalid credentials offer inline setup; verification and provider errors keep separate paths", () => {
  assert.equal(passwordNextStep(null), "signed-in");
  assert.equal(passwordNextStep({ code: "invalid_credentials" }), "profile");
  assert.equal(passwordNextStep({ code: "email_not_confirmed" }), "verify");
  for (const code of ["over_request_rate_limit", "unexpected_failure", "request_timeout", undefined]) assert.equal(passwordNextStep({ code }), "error");
});

test("complete names, major and graduation year are required before account creation", async () => {
  let calls = 0;
  const signUp = async () => { calls++; return { session: null }; };
  for (const invalid of [
    { ...profile, first_name: " " }, { ...profile, last_name: "" }, { ...profile, major: "" },
    { ...profile, year: "Freshman" }, { ...profile, year: "2300" }, { ...profile, year: "20xx" },
    { ...profile, email: "invalid" }, { ...profile, password: "short" },
  ]) await assert.rejects(createMemberFromProfile({ email: "ana@example.com", password: "a-safe-password", ...invalid }, "https://sase.example/auth/callback", signUp));
  assert.equal(calls, 0);
});

test("signup passes normalized profile metadata and preserves a pending verification response", async () => {
  const result = await createMemberFromProfile({ ...profile, email: " ANA@EXAMPLE.COM ", password: "correct horse battery" }, "https://sase.example/auth/callback?redirect=%2Fcheckin%2Fscan%2Fevent", async credentials => {
    assert.equal(credentials.email, "ana@example.com");
    assert.equal(credentials.options.data.first_name, "Ana");
    assert.equal(credentials.options.data.signup_profile_complete, true);
    assert.match(credentials.options.emailRedirectTo, /checkin/);
    return { session: null, error: null };
  });
  assert.equal(result.session, null);
});

test("an existing account rejection never becomes a signed-in session", async () => {
  const rejection = { session: null, error: { code: "user_already_exists" } };
  const result = await createMemberFromProfile({ ...profile, email: "ana@example.com", password: "new password" }, "https://sase.example/auth/callback", async () => rejection);
  assert.equal(result, rejection);
  assert.equal(result.session, null);
});

test("profile completion requires demographics even when a name was previously confirmed", () => {
  assert.equal(profileIsComplete({ ...profile, name_confirmed: true }), true);
  assert.equal(profileIsComplete({ ...profile, name_confirmed: false }), false);
  assert.equal(profileIsComplete({ ...profile, name_confirmed: true, year: "" }), false);
  assert.equal(profileIsComplete(null), false);
  assert.equal(parseJoinProfile(profile).last_name, "de la Cruz");
});

test("legacy access URLs preserve check-in destinations and reject loops and external redirects", () => {
  assert.equal(getSafeAuthRedirect("/checkin/scan/event?from=qr", "/membership"), "/checkin/scan/event?from=qr");
  for (const destination of ["/signup", "/signup?redirect=/signup", "https://evil.example", "//evil.example"]) assert.equal(getSafeAuthRedirect(destination, "/membership"), "/membership");
});
