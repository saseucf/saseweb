import assert from "node:assert/strict";
import test from "node:test";
import { executeEventMutation, type EventMutation } from "../lib/event-mutations";

const id = "7caa4338-6542-4d70-8d04-5cf5460cb52d";
const fields = { title: "Workshop", event_type: "Workshop - Tech", start_time: "2026-10-22T20:00:00Z", end_time: "2026-10-22T21:00:00Z", points: 1, capacity: null, status: "published" };
function dependencies(overrides: Partial<Parameters<typeof executeEventMutation>[1]> = {}) {
  return {
    authorize: async () => ({ status: "authorized" as const, adminId: id }), configured: true,
    write: async () => ({ error: null }), refresh: async () => {},
    report: () => {}, ...overrides,
  };
}

test("an uncategorized event can be created against the live schema without category columns", async () => {
  let writes = 0;
  const result = await executeEventMutation({ type: "save", eventData: fields }, dependencies({ write: async mutation => {
    writes++;
    assert.equal(mutation.type, "save");
    if (mutation.type === "save") {
      assert.equal("academic_field_id" in mutation.eventData, false);
      assert.equal(mutation.existingId, undefined);
      assert.equal(mutation.eventData.title, "Workshop");
    }
    return { error: null };
  } }));
  assert.deepEqual(result, { ok: true });
  assert.equal(writes, 1);
});

test("older clients sending a null optional category retry only the missing column for create and edit", async () => {
  for (const code of ["PGRST204", "42703"]) for (const existingId of [undefined, id]) {
    const writes: EventMutation[] = [];
    const result = await executeEventMutation({ type: "save", eventData: { ...fields, academic_field_id: null }, existingId }, dependencies({ write: async mutation => {
      writes.push(mutation);
      return { error: writes.length === 1 ? { code, message: "Could not find academic_field_id in events" } : null };
    } }));
    assert.deepEqual(result, { ok: true });
    assert.equal(writes.length, 2);
    const retry = writes[1];
    assert.equal(retry.type, "save");
    if (retry.type === "save") {
      assert.equal("academic_field_id" in retry.eventData, false);
      assert.equal(retry.existingId, existingId);
      assert.equal(retry.eventData.status, "published");
    }
  }
});

test("a selected category is never silently discarded and an unrelated error is not retried", async () => {
  for (const [category, error, message] of [
    [id, { code: "PGRST204", message: "academic_field_id missing" }, /categories are not configured/],
    [null, { code: "42703", message: "status missing" }, /could not be saved/],
  ] as const) {
    let writes = 0;
    const result = await executeEventMutation({ type: "save", eventData: { ...fields, academic_field_id: category } }, dependencies({ write: async () => { writes++; return { error }; } }));
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, message);
    assert.equal(writes, 1);
  }
});

test("every event mutation rejects unauthorized callers before any service-role write", async () => {
  for (const status of ["unauthenticated", "forbidden", "unavailable"] as const) for (const mutation of [
    { type: "save", eventData: fields }, { type: "cancel", eventId: id }, { type: "delete", eventId: id },
  ] satisfies EventMutation[]) {
    const result = await executeEventMutation(mutation, dependencies({ authorize: async () => ({ status }), write: async () => { assert.fail("No unauthorized writes"); }, refresh: async () => { assert.fail("No unauthorized refresh"); } }));
    assert.equal(result.ok, false);
  }
});

test("missing configuration and invalid event values return errors without writes", async () => {
  const deps = dependencies({ write: async () => { assert.fail("No invalid writes"); } });
  assert.equal((await executeEventMutation({ type: "save", eventData: fields }, { ...deps, configured: false })).ok, false);
  for (const values of [{ title: "" }, { start_time: "invalid" }, { end_time: fields.start_time }, { capacity: 0 }, { points: -1 }, { status: "unknown" }]) {
    assert.equal((await executeEventMutation({ type: "save", eventData: { ...fields, ...values } }, deps)).ok, false);
  }
});

test("safe errors survive serialization, and internal provider details stay server-side", async () => {
  const result = await executeEventMutation({ type: "save", eventData: fields }, dependencies({ write: async () => ({ error: { code: "P0001", message: "private database detail" } }) }));
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  assert.doesNotMatch(JSON.stringify(result), /private database detail/);
});

test("cache failure after a successful save is not reported as a failed write", async () => {
  let writes = 0;
  const result = await executeEventMutation({ type: "save", eventData: fields }, dependencies({ write: async () => { writes++; return { error: null }; }, refresh: async () => { throw new Error("cache unavailable"); } }));
  assert.deepEqual(result, { ok: true });
  assert.equal(writes, 1);
});

test("new event defaults are 30 points and TBD while explicit zero points are preserved", async () => {
  for (const points of [undefined, 0]) {
    const result = await executeEventMutation({ type: "save", eventData: { ...fields, points, location: "  " } }, dependencies({ write: async mutation => {
      assert.equal(mutation.type, "save");
      if (mutation.type === "save") { assert.equal(mutation.eventData.points, points ?? 30); assert.equal(mutation.eventData.location, "TBD"); }
      return { error: null };
    } }));
    assert.equal(result.ok, true);
  }
});

test("edit history is recorded after a successful write with the authorized actor", async () => {
  const calls: string[] = [];
  const result = await executeEventMutation({ type: "save", eventData: fields, existingId: id }, dependencies({
    write: async () => { calls.push("write"); return { error: null }; },
    recordEdit: async (mutation, actor) => { assert.equal(actor, id); assert.equal(mutation.type, "save"); calls.push("history"); },
    refresh: async () => { calls.push("refresh"); },
  }));
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(calls, ["write", "history", "refresh"]);
});
