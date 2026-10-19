import assert from "node:assert/strict";
import test from "node:test";
import { LEADERBOARD_REFRESH_MS, pollLeaderboard } from "../lib/leaderboard-polling";

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test("visible standings automatically load updated points every five seconds and pause in hidden tabs", async context => {
  context.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  let points = 10, visible = true;
  const updates: number[] = [];
  const poller = pollLeaderboard({ load: async () => points, update: value => updates.push(value), failed: () => assert.fail("Unexpected failure"), visible: () => visible });
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS); await flush();
  points = 35;
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS); await flush();
  assert.deepEqual(updates, [10, 35]);
  visible = false;
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS); await flush();
  assert.deepEqual(updates, [10, 35]);
  visible = true; points = 50;
  await poller.refresh();
  assert.deepEqual(updates, [10, 35, 50]);
  poller.stop();
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS); await flush();
  assert.deepEqual(updates, [10, 35, 50]);
});

test("refresh requests do not overlap and stopping the component cancels its in-flight request", async context => {
  context.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  let calls = 0;
  let signal: AbortSignal | undefined;
  let resolve!: (value: number) => void;
  const updates: number[] = [];
  const poller = pollLeaderboard({ load: received => { calls++; signal = received; return new Promise<number>(done => { resolve = done; }); }, update: value => updates.push(value), failed: () => assert.fail("Unmount must not report an error"), visible: () => true });
  const pending = poller.refresh();
  await poller.refresh();
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS);
  assert.equal(calls, 1);
  poller.stop();
  assert.equal(signal?.aborted, true);
  resolve(40); await pending;
  assert.deepEqual(updates, []);
});

test("a failed update is reported without clearing the last result, and subsequent polling recovers", async context => {
  context.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  let fail = false, failures = 0;
  const updates: number[] = [];
  const poller = pollLeaderboard({ load: async () => { if (fail) throw new Error("offline"); return 25; }, update: value => updates.push(value), failed: () => { failures++; }, visible: () => true });
  await poller.refresh(); fail = true;
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS); await flush();
  assert.deepEqual(updates, [25]); assert.equal(failures, 1);
  fail = false;
  context.mock.timers.tick(LEADERBOARD_REFRESH_MS); await flush();
  assert.deepEqual(updates, [25, 25]);
  poller.stop();
});
