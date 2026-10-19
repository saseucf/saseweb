import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, membersCsv, parseMemberInput, tableCsv } from "../lib/member-tools";

test("guest names preserve compound surnames and normalize email", () => {
  assert.deepEqual(parseMemberInput({ fullName: "  Ana  de la Cruz ", email: " ANA@example.com " }), { firstName: "Ana", lastName: "de la Cruz", email: "ana@example.com" });
  assert.deepEqual(parseMemberInput({ firstName: "Li", lastName: "Wang", email: "li@example.com" }), { firstName: "Li", lastName: "Wang", email: "li@example.com" });
});

test("table exports preserve duplicate question titles and escape headers and answers", () => {
  const csv = tableCsv(['Question "one"', "Answer", "Answer", "=Header"], [["line\nbreak", "=1+1", "a,b", null]]);
  assert.equal(csv, '\uFEFF"Question ""one""","Answer","Answer","\'=Header"\r\n"line\nbreak","\'=1+1","a,b",""');
});

test("invalid guest and quick-add data is rejected before provisioning", () => {
  for (const input of [null, {}, { fullName: "One", email: "a@b.com" }, { fullName: "Two Names", email: "invalid" }, { firstName: "a".repeat(101), lastName: "B", email: "a@b.com" }]) {
    assert.throws(() => parseMemberInput(input));
  }
});

test("member CSV preserves quotes, commas, newlines and neutralizes formulas", () => {
  assert.equal(csvCell('Jane "JJ", Doe'), '"Jane ""JJ"", Doe"');
  assert.equal(csvCell("=HYPERLINK(1)"), '"\'=HYPERLINK(1)"');
  assert.equal(csvCell("  +123"), '"\'  +123"');
  assert.equal(csvCell("\tformula"), '"\'\tformula"');
  const csv = membersCsv([{ name: "A\nB", points: 2 }, { name: "C", major: "Physics" }]);
  assert.equal(csv, '\uFEFF"name","points","major"\r\n"A\nB","2",""\r\n"C","","Physics"');
});
