import assert from "node:assert/strict";
import test from "node:test";
import { eventDateKey, eventDescription, eventOccursOn, eventStatus, formatEventRange, googleCalendarUrl, icsDataUrl, type PublicEvent } from "../components/events/event-display";

const event: PublicEvent = {
    id: "calendar-regression", title: "Workshop, Q&A; together", description: "First line\nSecond line\n\n===EXTERNAL_URL===https://example.org/register",
    event_type: "Workshop", location: "Campus, Room 2", start_time: "2026-09-08T00:57:00Z", end_time: "2026-09-08T02:00:00Z",
    capacity: null, points: 30, host: null, created_at: "2026-08-01T12:00:00Z", status: "published",
};

test("late evening UTC dates group under the chapter's Eastern date", () => {
    assert.equal(eventDateKey(event.start_time), "2026-09-07");
    assert.equal(eventOccursOn(event, "2026-09-07"), true);
    assert.equal(eventOccursOn(event, "2026-09-08"), false);
    assert.match(formatEventRange(event), /Mon, Sep 7/);
    assert.match(formatEventRange(event), /8:57 PM/);
    assert.equal(eventDateKey("2026-01-02T03:00:00Z"), "2026-01-01");
});

test("multi-day records show both dates and occupy each calendar day until they end", () => {
    const multi = { ...event, end_time: "2026-09-10T23:57:00Z" };
    assert.match(formatEventRange(multi), /Thu, Sep 10/);
    for (const day of ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10"]) assert.equal(eventOccursOn(multi, day), true);
    assert.equal(eventOccursOn(multi, "2026-09-11"), false);
    assert.equal(eventOccursOn({ ...event, end_time: "2026-09-08T04:00:00Z" }, "2026-09-08"), false);
});

test("day grouping remains correct across daylight saving transitions", () => {
    const overnight = { ...event, start_time: "2026-11-01T03:30:00Z", end_time: "2026-11-01T07:30:00Z" };
    assert.equal(eventDateKey(overnight.start_time), "2026-10-31");
    assert.equal(eventDateKey(overnight.end_time), "2026-11-01");
    assert.equal(eventOccursOn(overnight, "2026-11-01"), true);
});

test("ongoing events remain in the upcoming view until their end instant", () => {
    assert.equal(eventStatus(event, "2026-09-07T12:00:00Z"), "upcoming");
    assert.equal(eventStatus(event, event.start_time), "ongoing");
    assert.equal(eventStatus(event, event.end_time), "past");
});

test("registration metadata stays out of copy and only web URLs become RSVP links", () => {
    assert.deepEqual(eventDescription(event.description), { text: "First line\nSecond line", externalUrl: "https://example.org/register" });
    assert.deepEqual(eventDescription("Hello\n\n===EXTERNAL_URL===javascript:alert(1)"), { text: "Hello", externalUrl: "" });
    assert.deepEqual(eventDescription(null), { text: "", externalUrl: "" });
});

test("calendar exports retain event timing and keep registration metadata out of descriptions", () => {
    const google = new URL(googleCalendarUrl(event));
    assert.equal(google.searchParams.get("dates"), "20260908T005700Z/20260908T020000Z");
    assert.equal(google.searchParams.get("details"), "First line\nSecond line");
    const ics = decodeURIComponent(icsDataUrl(event).split(",").slice(1).join(","));
    assert.match(ics, /DTSTART:20260908T005700Z/);
    assert.match(ics, /UID:calendar-regression@saseucf/);
    assert.ok(ics.includes("SUMMARY:Workshop\\, Q&A\\; together"));
    assert.ok(ics.includes("DESCRIPTION:First line\\nSecond line"));
    assert.ok(!ics.includes("EXTERNAL_URL"));
});
