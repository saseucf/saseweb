import assert from "node:assert/strict";
import test from "node:test";
import { guestCheckinIsOpen, registerGuestAttendance } from "../lib/guest-checkin-core";

const input = { firstName: "Ana", lastName: "Lee", email: "ana@example.com" };
test("guest check-in has no date window; only missing and cancelled events are blocked", () => {
  for (const year of [2001, 2026, 2099]) {
    const event = { start_time: `${year}-10-19T20:00:00Z`, end_time: `${year}-10-19T22:00:00Z` };
    assert.equal(guestCheckinIsOpen(event), true);
    assert.equal(guestCheckinIsOpen({ ...event, status: "cancelled" }), false);
  }
  assert.equal(guestCheckinIsOpen(null), false);
  assert.equal(guestCheckinIsOpen({ start_time: "invalid", end_time: "invalid" }), true);
});

test("new guests are provisioned before attendance is recorded and delivery failures stay visible", async () => {
  const calls: string[] = [];
  const result = await registerGuestAttendance(input, {
    onboard: async member => { assert.deepEqual(member, input); calls.push("account"); return { id: "member-1", created: true, emailSent: false }; },
    attend: async id => { assert.equal(id, "member-1"); calls.push("attendance"); return { error: null }; },
  });
  assert.deepEqual(calls, ["account", "attendance"]);
  assert.match(result.message, /checked in/);
  assert.match(result.emailWarning!, /could not be sent/);
});

test("duplicate attendance is a stable success and other database failures remain retryable", async () => {
  const onboard = async () => ({ id: "existing", created: false, emailSent: false });
  const result = await registerGuestAttendance(input, { onboard, attend: async () => ({ error: { code: "23505" } }) });
  assert.match(result.message, /already checked in/);
  assert.equal(result.emailWarning, null);
  await assert.rejects(registerGuestAttendance(input, { onboard, attend: async () => ({ error: { code: "08006" } }) }), /check-in failed/);
});

test("provisioning failure never creates attendance", async () => {
  let attended = false;
  await assert.rejects(registerGuestAttendance(input, {
    onboard: async () => { throw new Error("provider unavailable"); },
    attend: async () => { attended = true; return { error: null }; },
  }), /provider unavailable/);
  assert.equal(attended, false);
});
