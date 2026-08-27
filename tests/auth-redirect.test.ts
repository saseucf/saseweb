import assert from "node:assert/strict";
import test from "node:test";

import { getSafeAuthRedirect } from "../lib/auth-redirect";

test("keeps normal internal auth destinations", () => {
  assert.equal(getSafeAuthRedirect("/membership"), "/membership");
  assert.equal(
    getSafeAuthRedirect("/forms/example?step=2#response"),
    "/forms/example?step=2#response",
  );
});

test("rejects external and malformed auth destinations", () => {
  assert.equal(getSafeAuthRedirect("https://example.com"), "/");
  assert.equal(getSafeAuthRedirect("//example.com/path"), "/");
  assert.equal(getSafeAuthRedirect("/\\example.com"), "/");
  assert.equal(getSafeAuthRedirect("not-a-path"), "/");
  assert.equal(getSafeAuthRedirect("/a".repeat(1_100)), "/");
});

test("prevents redirects back into auth entry pages", () => {
  for (const path of [
    "/login",
    "/login?redirect=/membership",
    "/auth/callback",
    "/confirm-name",
    "/checkin/login",
    "/checkin/admin/login",
  ]) {
    assert.equal(getSafeAuthRedirect(path), "/");
  }
  assert.equal(getSafeAuthRedirect(null, "/checkin/member"), "/checkin/member");
});
