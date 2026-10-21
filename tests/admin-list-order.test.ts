import assert from "node:assert/strict";
import test from "node:test";
import { compareAdminItems, isCompletedEvent, lastEditedTime, latestEditTimes, organizeAdminEvents, searchEditableItems, type AdminListEvent } from "../lib/admin-list-order";

const now = Date.parse("2026-10-21T16:00:00Z");
function event(overrides: Partial<AdminListEvent> = {}): AdminListEvent {
  return { id: "event", title: "Tech Workshop", description: "Build a resume", event_type: "Workshop - Tech", location: "Engineering 101", host: "Ana Smith", start_time: "2026-10-22T18:00:00Z", end_time: "2026-10-22T19:00:00Z", points: 30, capacity: null, status: "published", created_at: "2026-10-01T12:00:00Z", ...overrides };
}

test("only ended events go into type folders; ongoing and future events stay outside", () => {
  const future = event({ id: "future" });
  const ongoing = event({ id: "ongoing", start_time: "2026-10-21T15:00:00Z", end_time: "2026-10-21T17:00:00Z" });
  const past = event({ id: "past", end_time: "2026-10-21T16:00:00Z", start_time: "2026-10-21T15:00:00Z" });
  const health = event({ id: "health", event_type: "Workshop - Pre-Health", start_time: "2026-10-20T15:00:00Z", end_time: "2026-10-20T16:00:00Z" });
  const result = organizeAdminEvents([future, past, ongoing, health], "", now);
  assert.deepEqual(result.upcoming.map(item => item.id), ["ongoing", "future"]);
  assert.deepEqual(result.folders.map(folder => folder.type), ["Workshop - Pre-Health", "Workshop - Tech"]);
  assert.deepEqual(result.folders.flatMap(folder => folder.events.map(item => item.id)).sort(), ["health", "past"]);
  assert.equal(isCompletedEvent(past, now), true);
  assert.equal(isCompletedEvent(ongoing, now), false);
});

test("editing promotes a later event; untouched records use earliest start time", () => {
  const early = event({ id: "early", start_time: "2026-10-22T17:00:00Z" });
  const later = event({ id: "later", start_time: "2026-10-23T17:00:00Z" });
  const edited = event({ id: "edited", start_time: "2026-11-01T17:00:00Z", last_edited_at: "2026-10-21T15:00:00Z" });
  assert.deepEqual([later, early, edited].sort(compareAdminItems).map(item => item.id), ["edited", "early", "later"]);
});

test("search finds archived events by all details and ranks title matches before other matches", () => {
  const past = event({ id: "past", title: "Tech", start_time: "2026-10-19T18:00:00Z", end_time: "2026-10-19T19:00:00Z" });
  const future = event({ id: "future", title: "Community", location: "Tech center", last_edited_at: "2026-10-21T15:00:00Z" });
  assert.deepEqual(organizeAdminEvents([future, past], "tech", now).matching.map(item => item.id), ["past", "future"]);
  for (const query of ["engineering", "smith", "resume", "october 22", "30", "published"]) assert.equal(organizeAdminEvents([event()], query, now).matching.length, 1);
  assert.equal(organizeAdminEvents([event({ forms: [{ id: "form", title: "Mentorship application" }] })], "mentorship", now).matching.length, 1);
  assert.equal(organizeAdminEvents([event()], "does not exist", now).matching.length, 0);
  assert.equal(organizeAdminEvents([event({ location: null })], "tbd", now).matching.length, 1);
  assert.equal(organizeAdminEvents([event()], "ongoing", now).matching.length, 0);
});

test("form searches support multiple fields and recent edits precede linked-event dates", () => {
  const forms = [
    { id: "early", title: "Sign-up", start_time: "2026-10-22T12:00:00Z", created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-01T12:00:00Z", description: "Résumé help" },
    { id: "edited", title: "Application", start_time: "2026-11-22T12:00:00Z", created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-21T12:00:00Z", description: "Resume workshop" },
  ];
  assert.deepEqual(searchEditableItems(forms, "resume", item => [item.description]).map(item => item.id), ["edited", "early"]);
  assert.equal(lastEditedTime(forms[0]), 0);
  assert.equal(lastEditedTime(forms[1]), Date.parse(forms[1].updated_at));
});

test("latest audit edits are selected regardless of query order, ignoring invalid dates", () => {
  assert.deepEqual(latestEditTimes([
    { entity_id: "event", created_at: "2026-10-20T12:00:00Z" },
    { entity_id: "event", created_at: "2026-10-21T12:00:00Z" },
    { entity_id: "event", created_at: "invalid" },
    { entity_id: null, created_at: "2026-10-22T12:00:00Z" },
  ]), { event: "2026-10-21T12:00:00Z" });
});
