import assert from "node:assert/strict";
import test from "node:test";
import { createProfileRoleTracker, type ProfileRoleState } from "../lib/profile-role-state";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test("a slow previous admin lookup cannot grant admin navigation to a new member", async () => {
  const admin = deferred<string>();
  const member = deferred<string>();
  const states: ProfileRoleState[] = [];
  const tracker = createProfileRoleTracker(id => id === "old-admin" ? admin.promise : member.promise, state => states.push(state));
  const oldRequest = tracker.setUser("old-admin");
  const newRequest = tracker.setUser("new-member");
  assert.deepEqual(states.at(-1), { userId: "new-member", role: null, loading: true });
  member.resolve("user");
  await newRequest;
  admin.resolve("admin");
  await oldRequest;
  assert.deepEqual(states.at(-1), { userId: "new-member", role: "user", loading: false });
  assert.equal(states.some(state => state.role === "admin"), false);
});

test("switching away from an already loaded admin clears admin access immediately", async () => {
  const member = deferred<string>();
  let state: ProfileRoleState | undefined;
  const tracker = createProfileRoleTracker(id => id === "admin" ? Promise.resolve("admin") : member.promise, next => { state = next; });
  await tracker.setUser("admin");
  assert.equal(state?.role, "admin");
  const request = tracker.setUser("member");
  assert.deepEqual(state, { userId: "member", role: null, loading: true });
  member.resolve("user");
  await request;
  assert.equal(state?.role, "user");
});

test("logout invalidates in-flight admin lookups", async () => {
  const admin = deferred<string>();
  let state: ProfileRoleState | undefined;
  const tracker = createProfileRoleTracker(() => admin.promise, next => { state = next; });
  const request = tracker.setUser("admin");
  await tracker.setUser(null);
  admin.resolve("admin");
  await request;
  assert.deepEqual(state, { userId: null, role: null, loading: false });
});

test("profile failures cannot retain admin privileges and disposed lookups cannot publish", async () => {
  const states: ProfileRoleState[] = [];
  const tracker = createProfileRoleTracker(async () => { throw new Error("connection failed"); }, state => states.push(state));
  await tracker.setUser("member");
  assert.deepEqual(states.at(-1), { userId: "member", role: "user", loading: false });
  const pending = deferred<string>();
  const other = createProfileRoleTracker(() => pending.promise, state => states.push(state));
  const request = other.setUser("old-admin");
  const count = states.length;
  other.dispose();
  pending.resolve("admin");
  await request;
  assert.equal(states.length, count);
});
