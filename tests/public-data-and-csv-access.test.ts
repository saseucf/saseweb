import assert from "node:assert/strict";
import test from "node:test";
import { aggregateMemberMajors } from "../lib/chapter-demographics";
import { AdminCsvAccessError, assertAdminCsvAccess, canDownloadCsv } from "../lib/csv-access";
import { publicLeaderboardEntries } from "../lib/leaderboard";

const fetchResult = (status: number, body: unknown): typeof fetch => async (input, options) => {
  assert.equal(input, "/api/admin/export-access");
  assert.equal(options?.cache, "no-store");
  return Response.json(body, { status });
};

test("CSV access requires a successful server response with explicit admin authorization", async () => {
  for (const [status, body] of [[401, { isAdmin: false }], [403, { isAdmin: false }], [503, {}], [200, { isAdmin: false }], [200, { isAdmin: "true" }], [200, {}]] as const) {
    assert.equal(await canDownloadCsv(fetchResult(status, body)), false);
    await assert.rejects(assertAdminCsvAccess(fetchResult(status, body)), AdminCsvAccessError);
  }
  assert.equal(await canDownloadCsv(fetchResult(200, { isAdmin: true })), true);
  await assert.doesNotReject(assertAdminCsvAccess(fetchResult(200, { isAdmin: true })));
});

test("an earlier admin check cannot authorize a later download after permissions change", async () => {
  assert.equal(await canDownloadCsv(fetchResult(200, { isAdmin: true })), true);
  await assert.rejects(assertAdminCsvAccess(fetchResult(403, { isAdmin: false })), AdminCsvAccessError);
});

test("the public major breakdown contains only labels and counts, with no member identities", () => {
  const rows = [
    { major: "Physics", first_name: "Private One", email: "private-one@example.com", id: "private-id-1" },
    { major: " Physics ", first_name: "Private Two", email: "private-two@example.com", id: "private-id-2" },
    { major: "Biology", first_name: "Private Three", email: "private-three@example.com", id: "private-id-3" },
    { major: " ", first_name: "Private Four", email: "private-four@example.com", id: "private-id-4" },
  ];
  const result = aggregateMemberMajors(rows);
  assert.deepEqual(result, [{ name: "Physics", value: 2 }, { name: "Biology", value: 1 }]);
  assert.doesNotMatch(JSON.stringify(result), /Private|private-|email|first_name/);
});

test("major aggregates cover every supplied row and group remaining majors into Other", () => {
  const rows = Array.from({ length: 1500 }, (_, index) => ({ major: `Major ${index % 10}` }));
  const result = aggregateMemberMajors(rows);
  assert.equal(result.length, 8);
  assert.equal(result.reduce((sum, row) => sum + row.value, 0), 1500);
  assert.deepEqual(result.at(-1), { name: "Other", value: 450 });
});

test("public rankings include only displayed names, rank, and points; admin profiles and identifiers are omitted", () => {
  const result = publicLeaderboardEntries([
    { id: "private-admin-id", first_name: "Admin", last_name: "Private", total_points: 1000, role: "admin" },
    { id: "private-member-id", first_name: "Member", last_name: "Name", total_points: 15, role: "member" },
  ]);
  assert.deepEqual(result, [{ name: "Member Name", total_points: 15, rank: 1 }]);
  assert.doesNotMatch(JSON.stringify(result), /private-|role|Admin/);
});
