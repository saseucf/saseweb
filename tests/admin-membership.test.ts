import assert from "node:assert/strict";
import test from "node:test";

import {
  type ActivePaymentMatch,
  type AdminMember,
  type AdminMembershipDependencies,
  getAdminMembershipWorkspace,
  matchAdminMembershipPayment,
  unlinkAdminMembershipPayment,
} from "../lib/admin-membership-core";
import { adminMembershipResponse } from "../lib/admin-membership-http";
import type { ZeffyPayment } from "../lib/zeffy-core";

const ADMIN_ID = "7caa4338-6542-4d70-8d04-5cf5460cb52d";
const MEMBER_ID = "22fef938-9f26-4f72-843a-22b734004f59";
const MATCH_ID = "fb9018ab-93f9-458a-99e1-90f16b94cfb3";

function payment(overrides: Partial<ZeffyPayment> = {}): ZeffyPayment {
  return {
    id: "payment-1",
    createdAt: "2026-08-20T12:00:00.000Z",
    amountCents: 2500,
    refundedAmountCents: 0,
    netAmountCents: 2500,
    currency: "USD",
    status: "succeeded",
    refundStatus: "none",
    campaignId: "campaign-1",
    campaignTitle: "Memberships",
    receiptUrl: "https://example.com/receipt",
    buyer: {
      email: "buyer@example.com",
      firstName: "Buyer",
      lastName: "Name",
      phone: "+14075550123",
    },
    buyerQuestions: [],
    ...overrides,
  };
}

function member(overrides: Partial<AdminMember> = {}): AdminMember {
  return {
    id: MEMBER_ID,
    firstName: "Sam",
    lastName: "Lee",
    email: "sam@example.com",
    phoneNumber: "+14075550999",
    paidMember: false,
    ...overrides,
  };
}

function match(overrides: Partial<ActivePaymentMatch> = {}): ActivePaymentMatch {
  return {
    id: MATCH_ID,
    providerPaymentId: "payment-1",
    profileId: MEMBER_ID,
    membershipPeriod: "2026-2027",
    matchedAt: "2026-08-21T12:00:00.000Z",
    ...overrides,
  };
}

function dependencies(
  overrides: Partial<AdminMembershipDependencies> = {},
): AdminMembershipDependencies {
  return {
    configuration: {
      membershipPeriod: "2026-2027",
      expectedAmountCents: 2500,
      expectedCurrency: "USD",
    },
    authorizeAdmin: async () => ({ status: "authorized", adminId: ADMIN_ID }),
    listPayments: async () => ({ ok: true, data: [payment()] }),
    listMembers: async () => ({ ok: true, data: [member()] }),
    listActiveMatches: async () => ({ ok: true, data: [] }),
    matchPayment: async () => ({ ok: true, data: { matchId: MATCH_ID } }),
    unlinkPayment: async () => ({ ok: true, data: { paidMember: false } }),
    ...overrides,
  };
}

test("admin authorization short-circuits every workspace dependency", async () => {
  let downstreamCalls = 0;
  const result = await getAdminMembershipWorkspace(
    false,
    dependencies({
      authorizeAdmin: async () => ({ status: "unauthenticated" }),
      listPayments: async () => {
        downstreamCalls += 1;
        return { ok: true, data: [] };
      },
      listMembers: async () => {
        downstreamCalls += 1;
        return { ok: true, data: [] };
      },
      listActiveMatches: async () => {
        downstreamCalls += 1;
        return { ok: true, data: [] };
      },
    }),
  );

  assert.deepEqual(result, {
    ok: false,
    error: { kind: "unauthenticated", message: "Sign in to access membership payments." },
  });
  assert.equal(downstreamCalls, 0);
});

test("admin authorization short-circuits match and unlink writes", async () => {
  let downstreamCalls = 0;
  const deps = dependencies({
    authorizeAdmin: async () => ({ status: "forbidden" }),
    listPayments: async () => {
      downstreamCalls += 1;
      return { ok: true, data: [payment()] };
    },
    matchPayment: async () => {
      downstreamCalls += 1;
      return { ok: true, data: { matchId: MATCH_ID } };
    },
    unlinkPayment: async () => {
      downstreamCalls += 1;
      return { ok: true, data: { paidMember: false } };
    },
  });

  const matchResult = await matchAdminMembershipPayment(
    { providerPaymentId: "payment-1", profileId: MEMBER_ID },
    deps,
  );
  const unlinkResult = await unlinkAdminMembershipPayment(
    { matchId: MATCH_ID, reason: "Wrong member" },
    deps,
  );

  assert.equal(matchResult.ok, false);
  if (!matchResult.ok) assert.equal(matchResult.error.kind, "forbidden");
  assert.equal(unlinkResult.ok, false);
  if (!unlinkResult.ok) assert.equal(unlinkResult.error.kind, "forbidden");
  assert.equal(downstreamCalls, 0);
});

test("workspace hides matched payments by default and returns only unpaid members", async () => {
  const deps = dependencies({
    listPayments: async () => ({
      ok: true,
      data: [
        payment({ id: "payment-old", createdAt: "2026-08-01T00:00:00.000Z" }),
        payment(),
      ],
    }),
    listMembers: async () => ({
      ok: true,
      data: [member(), member({ id: ADMIN_ID, email: "paid@example.com", paidMember: true })],
    }),
    listActiveMatches: async () => ({ ok: true, data: [match()] }),
  });

  const hiddenResult = await getAdminMembershipWorkspace(false, deps);
  assert.equal(hiddenResult.ok, true);
  if (hiddenResult.ok) {
    assert.deepEqual(hiddenResult.data.payments.map(({ id }) => id), ["payment-old"]);
    assert.deepEqual(hiddenResult.data.unpaidMembers.map(({ id }) => id), [MEMBER_ID]);
  }

  const visibleResult = await getAdminMembershipWorkspace(true, deps);
  assert.equal(visibleResult.ok, true);
  if (visibleResult.ok) {
    assert.deepEqual(visibleResult.data.payments.map(({ id }) => id), [
      "payment-1",
      "payment-old",
    ]);
    assert.deepEqual(visibleResult.data.payments[0].match, {
      ...match(),
      member: member(),
    });
  }
});

test("workspace marks wrong-amount and refunded payments as ineligible", async () => {
  const result = await getAdminMembershipWorkspace(
    false,
    dependencies({
      listPayments: async () => ({
        ok: true,
        data: [
          payment({ id: "wrong-amount", amountCents: 1000, netAmountCents: 1000 }),
          payment({ id: "refunded", refundedAmountCents: 500, netAmountCents: 2000 }),
        ],
      }),
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    const refunded = result.data.payments.find(({ id }) => id === "refunded");
    const wrongAmount = result.data.payments.find(({ id }) => id === "wrong-amount");
    assert.equal(refunded?.eligible, false);
    assert.match(refunded?.eligibilityReason ?? "", /Refunded/);
    assert.equal(wrongAmount?.eligible, false);
    assert.match(wrongAmount?.eligibilityReason ?? "", /2500 cents/);
  }
});

test("matching re-fetches the trusted Zeffy payment before calling the database RPC", async () => {
  const savedInputs: Parameters<AdminMembershipDependencies["matchPayment"]>[0][] = [];
  const result = await matchAdminMembershipPayment(
    { providerPaymentId: "payment-1", profileId: MEMBER_ID },
    dependencies({
      matchPayment: async (input) => {
        savedInputs.push(input);
        return { ok: true, data: { matchId: MATCH_ID } };
      },
    }),
  );

  assert.deepEqual(result, { ok: true, data: { matchId: MATCH_ID } });
  assert.equal(savedInputs[0]?.payment.id, "payment-1");
  assert.equal(savedInputs[0]?.payment.amountCents, 2500);
  assert.equal(savedInputs[0]?.profileId, MEMBER_ID);
  assert.equal(savedInputs[0]?.membershipPeriod, "2026-2027");
});

test("matching rejects invalid, missing, or ineligible payments without a database write", async () => {
  let writes = 0;
  const base = {
    matchPayment: async () => {
      writes += 1;
      return { ok: true as const, data: { matchId: MATCH_ID } };
    },
  };

  const invalid = await matchAdminMembershipPayment(
    { providerPaymentId: "payment-1", profileId: "not-a-uuid" },
    dependencies(base),
  );
  assert.equal(invalid.ok, false);

  const missing = await matchAdminMembershipPayment(
    { providerPaymentId: "missing", profileId: MEMBER_ID },
    dependencies(base),
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.error.kind, "not_found");

  const refunded = await matchAdminMembershipPayment(
    { providerPaymentId: "payment-1", profileId: MEMBER_ID },
    dependencies({
      ...base,
      listPayments: async () => ({
        ok: true,
        data: [payment({ refundedAmountCents: 500, netAmountCents: 2000 })],
      }),
    }),
  );
  assert.equal(refunded.ok, false);
  if (!refunded.ok) assert.equal(refunded.error.kind, "conflict");
  assert.equal(writes, 0);
});

test("database uniqueness errors become stable conflicts", async () => {
  const result = await matchAdminMembershipPayment(
    { providerPaymentId: "payment-1", profileId: MEMBER_ID },
    dependencies({
      matchPayment: async () => ({ ok: false, error: { code: "23505" } }),
    }),
  );
  assert.deepEqual(result, {
    ok: false,
    error: {
      kind: "conflict",
      message: "That payment or member already has an active membership assignment.",
    },
  });
});

test("unlink validates input, authorizes, and passes a bounded audit reason", async () => {
  let unlinkInput: Parameters<AdminMembershipDependencies["unlinkPayment"]>[0] | null = null;
  const result = await unlinkAdminMembershipPayment(
    { matchId: MATCH_ID, reason: "  Assigned to the wrong member.  " },
    dependencies({
      unlinkPayment: async (input) => {
        unlinkInput = input;
        return { ok: true, data: { paidMember: false } };
      },
    }),
  );
  assert.deepEqual(result, { ok: true, data: { paidMember: false } });
  assert.deepEqual(unlinkInput, {
    matchId: MATCH_ID,
    reason: "Assigned to the wrong member.",
  });

  const tooLong = await unlinkAdminMembershipPayment(
    { matchId: MATCH_ID, reason: "x".repeat(501) },
    dependencies(),
  );
  assert.equal(tooLong.ok, false);
  if (!tooLong.ok) assert.equal(tooLong.error.kind, "invalid_input");
});

test("HTTP responses are non-cacheable and do not expose provider details", async () => {
  const response = adminMembershipResponse({
    ok: false,
    error: {
      kind: "provider_unavailable",
      message: "Zeffy payments could not be loaded. Try again shortly.",
      retryAfterSeconds: 60,
    },
  });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("retry-after"), "60");
  assert.deepEqual(await response.json(), {
    ok: false,
    error: {
      kind: "provider_unavailable",
      message: "Zeffy payments could not be loaded. Try again shortly.",
    },
  });
});
