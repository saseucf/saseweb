import assert from "node:assert/strict";
import test from "node:test";

import { getMembershipCheckoutConfiguration } from "../lib/membership-checkout";

const validInput = {
  checkoutUrl:
    "https://www.zeffy.com/en-US/ticketing/society-of-asian-scientists-and-engineerss-memberships",
  membershipPeriod: "2026-2027",
  amountCents: "2500",
  currency: "usd",
};

test("normalizes the configured Zeffy membership checkout", () => {
  assert.deepEqual(getMembershipCheckoutConfiguration(validInput), {
    ok: true,
    configuration: {
      checkoutUrl: validInput.checkoutUrl,
      membershipPeriod: "2026-2027",
      amountCents: 2500,
      currency: "USD",
    },
  });
});

test("rejects non-HTTPS and lookalike checkout hosts", () => {
  for (const checkoutUrl of [
    "http://www.zeffy.com/form",
    "https://zeffy.com.attacker.example/form",
    "https://attacker@www.zeffy.com/form",
    "javascript:alert('unsafe')",
  ]) {
    assert.deepEqual(getMembershipCheckoutConfiguration({ ...validInput, checkoutUrl }), {
      ok: false,
    });
  }
});

test("rejects incomplete or invalid dues configuration", () => {
  for (const input of [
    { ...validInput, membershipPeriod: "" },
    { ...validInput, amountCents: "0" },
    { ...validInput, amountCents: "25.5" },
    { ...validInput, currency: "US" },
  ]) {
    assert.deepEqual(getMembershipCheckoutConfiguration(input), { ok: false });
  }
});
