import assert from "node:assert/strict";
import test from "node:test";

import { getMemberNames } from "../lib/member-names";

test("uses a trimmed first name for the greeting and full name for display", () => {
  assert.deepEqual(
    getMemberNames({
      first_name: "  Stevin ",
      last_name: " Ngo  ",
      email: "stevin@example.com",
    }),
    { displayName: "Stevin Ngo", greetingName: "Stevin" },
  );
});

test("supports Discord profiles with only one name part", () => {
  assert.deepEqual(
    getMemberNames({
      first_name: "",
      last_name: "Nguyen",
      email: "member@example.com",
    }),
    { displayName: "Nguyen", greetingName: "Nguyen" },
  );
});

test("falls back to the email username when names are missing", () => {
  assert.deepEqual(
    getMemberNames({
      first_name: " ",
      last_name: "",
      email: "discord-member@example.com",
    }),
    { displayName: "discord-member", greetingName: "discord-member" },
  );
});

test("uses a stable generic fallback when no identity fields are available", () => {
  assert.deepEqual(
    getMemberNames({
      first_name: null,
      last_name: null,
      email: null,
    }),
    { displayName: "Member", greetingName: "Member" },
  );
});
