import assert from "node:assert/strict";
import test from "node:test";
import { durationMinutes, eventEndFromDuration, localDateTimeValue } from "../lib/event-scheduling";

test("duration calculates end times and moves forward when the start changes", () => {
  assert.equal(eventEndFromDuration("2026-10-21T18:00:00Z", 90), "2026-10-21T19:30:00.000Z");
  assert.equal(eventEndFromDuration("2026-10-21T19:00:00Z", 90), "2026-10-21T20:30:00.000Z");
  assert.equal(eventEndFromDuration("2026-10-21T23:30:00-04:00", 90), "2026-10-22T05:00:00.000Z");
});
test("duration uses elapsed minutes across daylight-saving transitions", () => {
  assert.equal(eventEndFromDuration("2026-11-01T01:30:00-04:00", 90), "2026-11-01T07:00:00.000Z");
  assert.equal(eventEndFromDuration("2026-03-08T01:30:00-05:00", 60), "2026-03-08T07:30:00.000Z");
});
test("invalid duration/start inputs cannot generate an invalid submission timestamp", () => {
  for (const minutes of [0, -1, NaN, 1.5, 10081]) assert.equal(eventEndFromDuration("2026-10-21T18:00:00Z", minutes), "");
  assert.equal(eventEndFromDuration("", 60), "");
  assert.equal(localDateTimeValue("invalid"), "");
  assert.equal(durationMinutes("2026-10-21T18:00:00Z", "2026-10-21T19:15:00Z"), 75);
});
