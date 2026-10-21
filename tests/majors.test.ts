import assert from "node:assert/strict";
import test from "node:test";
import { MAJORS, normalizeMajor } from "../lib/majors";
import { aggregateMemberMajors } from "../lib/chapter-demographics";
import { parseJoinProfile } from "../lib/unified-auth";

test("major aliases and mixed capitalization use the same canonical names", () => {
  const groups = {
    "Computer Science": ["CS", "comp sci", "computer science", "Computer Scienc"],
    "Computer Engineering": ["comp eng", "Computer engineering"],
    "Civil Engineering": ["civil eng", "CIVIL ENGINEERING"],
    "Mechanical Engineering": ["mech eng", "Mechanical Engineer"],
    "Biomedical Sciences": ["biomed", "Biomedical Science", "Biomedical scienc"],
    "Electrical Engineering": ["EE", "electrical engineering"],
    "Photonic Science and Engineering": ["Photonic Sciences & Engineering", "Photonics"],
  };
  for (const [canonical, aliases] of Object.entries(groups)) for (const alias of aliases) assert.equal(normalizeMajor(alias), canonical);
  for (const major of MAJORS) assert.equal(normalizeMajor(major), major);
});

test("Other, blanks, and unrecognized double majors retain their meaning", () => {
  assert.equal(normalizeMajor(" OTHER "), "Other");
  assert.equal(normalizeMajor(null), "");
  assert.equal(normalizeMajor("  aerospace + math "), "Aerospace + Math");
  assert.equal(normalizeMajor("Civil and Environmental Engineering"), "Civil And Environmental Engineering");
  assert.equal(normalizeMajor("Biomedical Engineering"), "Biomedical Engineering");
});

test("demographics merges aliases before ranking and combines Other once without losing counts", () => {
  const rows = ["CS", "comp sci", "Computer science", "Other", "other", "Physics", "Biology", "Chemistry", "Civil Engineering", "Mechanical Engineering", "Computer Engineering", "Biomedical Sciences", "Finance"].map(major => ({ major }));
  const result = aggregateMemberMajors(rows);
  assert.equal(result.find(major => major.name === "Computer Science")?.value, 3);
  assert.equal(result.filter(major => major.name === "Other").length, 1);
  assert.equal(result.reduce((sum, major) => sum + major.value, 0), rows.length);
});

test("registration normalizes majors before saving profile metadata", () => {
  assert.equal(parseJoinProfile({ first_name: "Ana", last_name: "Lee", year: "2029", school: "UCF", major: "comp eng" }).major, "Computer Engineering");
});
