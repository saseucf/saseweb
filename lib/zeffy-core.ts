const DEFAULT_BASE_URL = "https://api.zeffy.com";
const PAGE_SIZE = 100;
const MAX_PAGES = 100;

export const ZEFFY_ENV_KEYS = ["ZEFFY_API", "ZEFFY_CAMPAIGN_ID"] as const;

export type ZeffyEnvKey = (typeof ZEFFY_ENV_KEYS)[number];

export type ZeffyApiEnvironment = {
  ZEFFY_API?: string;
  ZEFFY_API_KEY?: string;
};

export function resolveZeffyApiKey(environment: ZeffyApiEnvironment): string | undefined {
  return environment.ZEFFY_API?.trim() || environment.ZEFFY_API_KEY?.trim() || undefined;
}

export type ZeffyQuestionAnswer = {
  question: string;
  type: string;
  answer: string | string[] | boolean;
};

export type ZeffyPayment = {
  id: string;
  createdAt: string;
  amountCents: number;
  refundedAmountCents: number;
  netAmountCents: number;
  currency: string;
  status: "succeeded";
  refundStatus: string;
  campaignId: string;
  campaignTitle: string | null;
  receiptUrl: string | null;
  buyer: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
  buyerQuestions: ZeffyQuestionAnswer[];
};

export type ZeffyClientError =
  | {
      kind: "not_configured";
      message: string;
      missing: ZeffyEnvKey[];
    }
  | {
      kind: "http";
      message: string;
      status: number;
      code: string | null;
      retryAfterSeconds: number | null;
    }
  | {
      kind: "network";
      message: string;
    }
  | {
      kind: "invalid_input";
      message: string;
    }
  | {
      kind: "invalid_response";
      message: string;
    };

export type ZeffyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ZeffyClientError };

export type ZeffyConfiguration =
  | { configured: true }
  | { configured: false; missing: ZeffyEnvKey[] };

export type ListSuccessfulPaymentsOptions = {
  createdAtOrAfter?: Date;
  signal?: AbortSignal;
};

export type ZeffyClientOptions = {
  apiKey?: string;
  campaignId?: string;
  currency?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function httpsUrl(value: unknown): string | null {
  const candidate = nonEmptyString(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseQuestion(value: unknown): ZeffyQuestionAnswer | null {
  const item = record(value);
  const question = nonEmptyString(item?.question);
  const type = nonEmptyString(item?.type);
  const answer = item?.answer;

  if (!question || !type) return null;
  if (
    typeof answer !== "string" &&
    typeof answer !== "boolean" &&
    !(Array.isArray(answer) && answer.every((entry) => typeof entry === "string"))
  ) {
    return null;
  }

  return { question, type, answer };
}

function parsePayment(value: unknown): ZeffyResult<ZeffyPayment | null> {
  const payment = record(value);
  if (!payment) {
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        message: "Zeffy returned a payment with missing or invalid required fields.",
      },
    };
  }

  const id = nonEmptyString(payment.id);
  const created = payment.created;
  const amountCents = nonNegativeInteger(payment.amount);
  const currency = nonEmptyString(payment.currency);
  const campaignId = nonEmptyString(payment.campaign_id);
  const status = nonEmptyString(payment.status);
  const createdAt =
    typeof created === "number" && Number.isFinite(created)
      ? new Date(created * 1000)
      : null;

  if (status !== "succeeded") return { ok: true, data: null };
  if (
    !id ||
    !createdAt ||
    Number.isNaN(createdAt.getTime()) ||
    amountCents === null ||
    !currency ||
    !campaignId
  ) {
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        message: "Zeffy returned a payment with missing or invalid required fields.",
      },
    };
  }

  const refunds = Array.isArray(payment.refunds) ? payment.refunds : [];
  const refundedAmountCents = refunds.reduce((total, value) => {
    const refund = record(value);
    if (refund?.status !== "succeeded") return total;
    return total + (nonNegativeInteger(refund.amount) ?? 0);
  }, 0);
  const buyer = record(payment.buyer);
  const buyerQuestions = Array.isArray(payment.buyer_questions)
    ? payment.buyer_questions.map(parseQuestion).filter((answer) => answer !== null)
    : [];
  const phoneAnswer = buyerQuestions.find(
    (answer) => answer.type === "phone" && typeof answer.answer === "string",
  );

  return {
    ok: true,
    data: {
      id,
      createdAt: createdAt.toISOString(),
      amountCents,
      refundedAmountCents,
      netAmountCents: Math.max(0, amountCents - refundedAmountCents),
      currency: currency.toUpperCase(),
      status: "succeeded",
      refundStatus: nonEmptyString(payment.refund_status) ?? "unknown",
      campaignId,
      campaignTitle: nonEmptyString(payment.description),
      receiptUrl: httpsUrl(payment.receipt_url),
      buyer: {
        email: nonEmptyString(buyer?.email),
        firstName: nonEmptyString(buyer?.first_name),
        lastName: nonEmptyString(buyer?.last_name),
        phone:
          phoneAnswer && typeof phoneAnswer.answer === "string"
            ? nonEmptyString(phoneAnswer.answer)
            : null,
      },
      buyerQuestions,
    },
  };
}

function parsePage(value: unknown): ZeffyResult<{
  payments: ZeffyPayment[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  const page = record(value);
  if (!page || !Array.isArray(page.data) || typeof page.has_more !== "boolean") {
    return {
      ok: false,
      error: {
        kind: "invalid_response",
        message: "Zeffy returned an invalid payment list response.",
      },
    };
  }

  const payments: ZeffyPayment[] = [];
  for (const value of page.data) {
    const parsed = parsePayment(value);
    if (!parsed.ok) return parsed;
    if (parsed.data) payments.push(parsed.data);
  }

  return {
    ok: true,
    data: {
      payments,
      hasMore: page.has_more,
      nextCursor: nonEmptyString(page.next_cursor),
    },
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function createZeffyClient(options: ZeffyClientOptions) {
  const apiKey = options.apiKey?.trim() ?? "";
  const campaignId = options.campaignId?.trim() ?? "";
  const currency = (options.currency?.trim() || "USD").toLowerCase();
  const baseUrl = (options.baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const missing: ZeffyEnvKey[] = [];
  if (!apiKey) missing.push("ZEFFY_API");
  if (!campaignId) missing.push("ZEFFY_CAMPAIGN_ID");

  function getConfiguration(): ZeffyConfiguration {
    return missing.length
      ? { configured: false, missing: [...missing] }
      : { configured: true };
  }

  async function listSuccessfulPayments(
    input: ListSuccessfulPaymentsOptions = {},
  ): Promise<ZeffyResult<ZeffyPayment[]>> {
    if (missing.length) {
      return {
        ok: false,
        error: {
          kind: "not_configured",
          message: `Zeffy is not configured. Missing: ${missing.join(", ")}.`,
          missing: [...missing],
        },
      };
    }

    if (input.createdAtOrAfter && Number.isNaN(input.createdAtOrAfter.getTime())) {
      return {
        ok: false,
        error: {
          kind: "invalid_input",
          message: "The Zeffy payment date filter is invalid.",
        },
      };
    }

    const payments: ZeffyPayment[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | null = null;

    for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber += 1) {
      const url = new URL("/api/v1/payments", baseUrl);
      url.searchParams.set("campaign", campaignId);
      url.searchParams.set("currency", currency);
      url.searchParams.set("status", "succeeded");
      url.searchParams.set("limit", String(PAGE_SIZE));
      if (cursor) url.searchParams.set("starting_after", cursor);
      if (input.createdAtOrAfter) {
        url.searchParams.set(
          "created[gte]",
          String(Math.floor(input.createdAtOrAfter.getTime() / 1000)),
        );
      }

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          cache: "no-store",
          signal: input.signal,
        });
      } catch {
        return {
          ok: false,
          error: {
            kind: "network",
            message: "Could not reach the Zeffy API.",
          },
        };
      }

      const body = await readJson(response);
      if (!response.ok) {
        const envelope = record(body);
        const apiError = record(envelope?.error);
        const retryAfter = response.headers.get("retry-after");
        return {
          ok: false,
          error: {
            kind: "http",
            message: nonEmptyString(apiError?.message) ?? "Zeffy rejected the request.",
            status: response.status,
            code: nonEmptyString(apiError?.code),
            retryAfterSeconds: retryAfter ? Number.parseInt(retryAfter, 10) || null : null,
          },
        };
      }

      const page = parsePage(body);
      if (!page.ok) return page;

      const unexpectedPayment = page.data.payments.some(
        (payment) =>
          payment.campaignId !== campaignId || payment.currency.toLowerCase() !== currency,
      );
      if (unexpectedPayment) {
        return {
          ok: false,
          error: {
            kind: "invalid_response",
            message: "Zeffy returned a payment outside the configured campaign or currency.",
          },
        };
      }

      payments.push(...page.data.payments);

      if (!page.data.hasMore) return { ok: true, data: payments };
      if (!page.data.nextCursor || seenCursors.has(page.data.nextCursor)) {
        return {
          ok: false,
          error: {
            kind: "invalid_response",
            message: "Zeffy returned an invalid or repeated pagination cursor.",
          },
        };
      }

      cursor = page.data.nextCursor;
      seenCursors.add(cursor);
    }

    return {
      ok: false,
      error: {
        kind: "invalid_response",
        message: "Zeffy pagination exceeded the safety limit.",
      },
    };
  }

  return { getConfiguration, listSuccessfulPayments };
}
