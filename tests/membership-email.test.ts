import assert from "node:assert/strict";
import test from "node:test";
import { planEmailMembershipMatches, type EmailPaymentMatch } from "../lib/membership-email";
import type { ZeffyPayment } from "../lib/zeffy-core";

const configuration = { membershipPeriod: "2026-2027", expectedAmountCents: 2500, expectedCurrency: "USD" };
const member = { id: "member-1", email: "member@example.com", paid_member: false };
const payment: ZeffyPayment = {
  id: "payment-1", createdAt: "2026-08-01T12:00:00Z", amountCents: 2500, netAmountCents: 2500,
  refundedAmountCents: 0, currency: "USD", status: "succeeded", refundStatus: "none", campaignId: "campaign",
  campaignTitle: null, receiptUrl: null, buyerQuestions: [],
  buyer: { email: " MEMBER@example.com ", firstName: "Same", lastName: "Name", phone: null },
};
const match: EmailPaymentMatch = { provider_payment_id: payment.id, profile_id: member.id, membership_period: configuration.membershipPeriod, unlinked_at: null };

test("exact registered email matches ignore case and whitespace", () => {
  assert.deepEqual(planEmailMembershipMatches([payment], [member], [], configuration), [{ payment, member, existing: false }]);
});

test("names never substitute for email and blank emails cannot match", () => {
  for (const email of [null, "", "another@example.com"]) assert.deepEqual(planEmailMembershipMatches([{ ...payment, buyer: { ...payment.buyer, email } }], [member], [], configuration), []);
});

test("refunded, partial, overpaid, and foreign-currency payments stay in review", () => {
  for (const overrides of [{ refundedAmountCents: 100 }, { netAmountCents: 2400 }, { amountCents: 2000 }, { amountCents: 3000 }, { currency: "CAD" }]) assert.deepEqual(planEmailMembershipMatches([{ ...payment, ...overrides }], [member], [], configuration), []);
});

test("ambiguous emails, paid members, and duplicate purchases cannot claim additional memberships", () => {
  assert.deepEqual(planEmailMembershipMatches([payment], [member, { ...member, id: "member-2" }], [], configuration), []);
  assert.deepEqual(planEmailMembershipMatches([payment], [{ ...member, paid_member: true }], [], configuration), []);
  assert.equal(planEmailMembershipMatches([payment, { ...payment, id: "payment-2" }], [member], [], configuration).length, 1);
});

test("payments assigned elsewhere and officer unlinks are preserved", () => {
  for (const history of [[{ ...match, profile_id: "another-member" }], [{ ...match, unlinked_at: "2026-10-20" }], [{ ...match, membership_period: "2025-2026" }], [{ ...match, provider_payment_id: "another-payment" }]]) assert.deepEqual(planEmailMembershipMatches([payment], [member], history, configuration), []);
});

test("an interrupted verification can repair its own existing active assignment", () => {
  assert.deepEqual(planEmailMembershipMatches([payment], [member], [match], configuration), [{ payment, member, existing: true }]);
  const secondPayment = { ...payment, id: "earlier-payment", createdAt: "2026-07-01T12:00:00Z" };
  assert.deepEqual(planEmailMembershipMatches([secondPayment, payment], [member], [match], configuration), [{ payment, member, existing: true }]);
});
