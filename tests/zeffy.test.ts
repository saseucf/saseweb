import assert from "node:assert/strict";
import test from "node:test";

import { createZeffyClient } from "../lib/zeffy-core";

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: "payment-1",
    created: 1_700_000_000,
    amount: 2500,
    currency: "usd",
    status: "succeeded",
    refund_status: "none",
    refunds: [],
    campaign_id: "campaign-1",
    description: "UCF SASE Dues",
    receipt_url: "https://example.com/receipt",
    buyer: {
      email: "member@example.com",
      first_name: "Sam",
      last_name: "Lee",
    },
    buyer_questions: [
      { question: "Phone", type: "phone", answer: "+14075550123" },
    ],
    ...overrides,
  };
}

test("reports missing configuration without making a request", async () => {
  let requests = 0;
  const client = createZeffyClient({
    fetchImpl: async () => {
      requests += 1;
      return new Response();
    },
  });

  assert.deepEqual(client.getConfiguration(), {
    configured: false,
    missing: ["ZEFFY_API_KEY", "ZEFFY_CAMPAIGN_ID"],
  });
  const result = await client.listSuccessfulPayments();
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.kind, "not_configured");
  }
  assert.equal(requests, 0);
});

test("requests and normalizes successful campaign payments", async () => {
  let requestUrl = "";
  let requestAuthorization = "";
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    currency: "USD",
    fetchImpl: async (input, init) => {
      requestUrl = String(input);
      requestAuthorization = new Headers(init?.headers).get("authorization") ?? "";
      return Response.json({
        object: "list",
        data: [payment()],
        has_more: false,
        next_cursor: null,
      });
    },
  });

  const result = await client.listSuccessfulPayments({
    createdAtOrAfter: new Date("2026-08-01T00:00:00.000Z"),
  });

  assert.equal(result.ok, true);
  assert.equal(requestAuthorization, "Bearer secret-key");
  const url = new URL(requestUrl);
  assert.equal(url.pathname, "/api/v1/payments");
  assert.equal(url.searchParams.get("campaign"), "campaign-1");
  assert.equal(url.searchParams.get("currency"), "usd");
  assert.equal(url.searchParams.get("status"), "succeeded");
  assert.equal(url.searchParams.get("limit"), "100");
  assert.equal(url.searchParams.get("created[gte]"), "1785542400");

  if (result.ok) {
    assert.deepEqual(result.data[0], {
      id: "payment-1",
      createdAt: "2023-11-14T22:13:20.000Z",
      amountCents: 2500,
      refundedAmountCents: 0,
      netAmountCents: 2500,
      currency: "USD",
      status: "succeeded",
      refundStatus: "none",
      campaignId: "campaign-1",
      campaignTitle: "UCF SASE Dues",
      receiptUrl: "https://example.com/receipt",
      buyer: {
        email: "member@example.com",
        firstName: "Sam",
        lastName: "Lee",
        phone: "+14075550123",
      },
      buyerQuestions: [
        { question: "Phone", type: "phone", answer: "+14075550123" },
      ],
    });
  }
});

test("follows Zeffy cursor pagination exactly once per cursor", async () => {
  const requests: string[] = [];
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    fetchImpl: async (input) => {
      const url = new URL(String(input));
      requests.push(url.toString());
      const cursor = url.searchParams.get("starting_after");
      return Response.json(
        cursor
          ? {
              object: "list",
              data: [payment({ id: "payment-2" })],
              has_more: false,
              next_cursor: null,
            }
          : {
              object: "list",
              data: [payment()],
              has_more: true,
              next_cursor: "payment-1",
            },
      );
    },
  });

  const result = await client.listSuccessfulPayments();
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.data.map(({ id }) => id), ["payment-1", "payment-2"]);
  assert.equal(requests.length, 2);
  assert.equal(new URL(requests[1]).searchParams.get("starting_after"), "payment-1");
});

test("tracks only succeeded refunds when calculating the net amount", async () => {
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    fetchImpl: async () =>
      Response.json({
        object: "list",
        data: [
          payment({
            refund_status: "partial",
            refunds: [
              { amount: 500, status: "succeeded" },
              { amount: 200, status: "failed" },
            ],
          }),
        ],
        has_more: false,
        next_cursor: null,
      }),
  });

  const result = await client.listSuccessfulPayments();
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data[0].refundedAmountCents, 500);
    assert.equal(result.data[0].netAmountCents, 2000);
  }
});

test("returns Zeffy error details and retry timing", async () => {
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    fetchImpl: async () =>
      Response.json(
        {
          error: {
            code: "rate_limit_exceeded",
            message: "Too many requests.",
          },
        },
        { status: 429, headers: { "Retry-After": "60" } },
      ),
  });

  const result = await client.listSuccessfulPayments();
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.error, {
      kind: "http",
      message: "Too many requests.",
      status: 429,
      code: "rate_limit_exceeded",
      retryAfterSeconds: 60,
    });
  }
});

test("returns a stable network error without exposing the thrown value", async () => {
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    fetchImpl: async () => {
      throw new Error("request included secret-key");
    },
  });

  const result = await client.listSuccessfulPayments();
  assert.deepEqual(result, {
    ok: false,
    error: { kind: "network", message: "Could not reach the Zeffy API." },
  });
});

test("rejects missing and repeated pagination cursors", async () => {
  for (const nextCursor of [null, "same-cursor"]) {
    let request = 0;
    const client = createZeffyClient({
      apiKey: "secret-key",
      campaignId: "campaign-1",
      fetchImpl: async () => {
        request += 1;
        return Response.json({
          object: "list",
          data: [],
          has_more: true,
          next_cursor: nextCursor ?? null,
        });
      },
    });

    const result = await client.listSuccessfulPayments();
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.kind, "invalid_response");
    assert.equal(request, nextCursor ? 2 : 1);
  }
});

test("rejects malformed dates without throwing or making a request", async () => {
  let requests = 0;
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    fetchImpl: async () => {
      requests += 1;
      return Response.json({
        data: [payment({ created: Number.MAX_VALUE })],
        has_more: false,
      });
    },
  });

  const invalidFilter = await client.listSuccessfulPayments({
    createdAtOrAfter: new Date(Number.NaN),
  });
  assert.deepEqual(invalidFilter, {
    ok: false,
    error: {
      kind: "invalid_input",
      message: "The Zeffy payment date filter is invalid.",
    },
  });
  assert.equal(requests, 0);

  const invalidPayment = await client.listSuccessfulPayments();
  assert.equal(invalidPayment.ok, false);
  if (!invalidPayment.ok) assert.equal(invalidPayment.error.kind, "invalid_response");
});

test("rejects payments outside the configured campaign or currency", async () => {
  for (const unexpected of [
    payment({ campaign_id: "other-campaign" }),
    payment({ currency: "cad" }),
  ]) {
    const client = createZeffyClient({
      apiKey: "secret-key",
      campaignId: "campaign-1",
      currency: "USD",
      fetchImpl: async () =>
        Response.json({ data: [unexpected], has_more: false, next_cursor: null }),
    });

    const result = await client.listSuccessfulPayments();
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.kind, "invalid_response");
  }
});

test("keeps only HTTPS receipt links", async () => {
  const client = createZeffyClient({
    apiKey: "secret-key",
    campaignId: "campaign-1",
    fetchImpl: async () =>
      Response.json({
        data: [payment({ receipt_url: "javascript:alert('unsafe')" })],
        has_more: false,
        next_cursor: null,
      }),
  });

  const result = await client.listSuccessfulPayments();
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data[0].receiptUrl, null);
});
