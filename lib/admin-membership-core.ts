import type { ZeffyPayment, ZeffyResult } from "@/lib/zeffy-core";

export type AdminMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  paidMember: boolean;
};

export type ActivePaymentMatch = {
  id: string;
  providerPaymentId: string;
  profileId: string;
  membershipPeriod: string;
  matchedAt: string;
};

export type MembershipConfiguration = {
  membershipPeriod: string;
  expectedAmountCents: number;
  expectedCurrency: string;
};

export type RepositoryError = {
  code: string | null;
};

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RepositoryError };

export type AdminAuthorization =
  | { status: "authorized"; adminId: string }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export type AdminMembershipDependencies = {
  configuration: MembershipConfiguration;
  authorizeAdmin: () => Promise<AdminAuthorization>;
  listPayments: () => Promise<ZeffyResult<ZeffyPayment[]>>;
  listMembers: () => Promise<RepositoryResult<AdminMember[]>>;
  listActiveMatches: () => Promise<RepositoryResult<ActivePaymentMatch[]>>;
  matchPayment: (input: {
    payment: ZeffyPayment;
    profileId: string;
    membershipPeriod: string;
  }) => Promise<RepositoryResult<{ matchId: string }>>;
  unlinkPayment: (input: {
    matchId: string;
    reason: string | null;
  }) => Promise<RepositoryResult<{ paidMember: boolean }>>;
};

export type AdminMembershipError = {
  kind:
    | "unauthenticated"
    | "forbidden"
    | "invalid_input"
    | "not_configured"
    | "provider_unavailable"
    | "data_unavailable"
    | "not_found"
    | "conflict";
  message: string;
  retryAfterSeconds?: number;
};

export type AdminMembershipResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdminMembershipError };

export type AdminPayment = {
  id: string;
  createdAt: string;
  amountCents: number;
  refundedAmountCents: number;
  netAmountCents: number;
  currency: string;
  refundStatus: string;
  receiptUrl: string | null;
  buyer: ZeffyPayment["buyer"];
  eligible: boolean;
  eligibilityReason: string | null;
  match: (ActivePaymentMatch & { member: AdminMember | null }) | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function authorizationErrorResult(
  authorization: Exclude<AdminAuthorization, { status: "authorized" }>,
): AdminMembershipResult<never> {
  if (authorization.status === "unauthenticated") {
    return {
      ok: false,
      error: { kind: "unauthenticated", message: "Sign in to access membership payments." },
    };
  }
  if (authorization.status === "forbidden") {
    return {
      ok: false,
      error: { kind: "forbidden", message: "Administrator access is required." },
    };
  }
  return {
    ok: false,
    error: {
      kind: "data_unavailable",
      message: "Administrator access could not be verified.",
    },
  };
}

function providerError(result: Extract<ZeffyResult<never>, { ok: false }>): AdminMembershipError {
  if (result.error.kind === "not_configured") {
    return {
      kind: "not_configured",
      message: "Zeffy payment reconciliation is not configured.",
    };
  }

  return {
    kind: "provider_unavailable",
    message: "Zeffy payments could not be loaded. Try again shortly.",
    ...(result.error.kind === "http" && result.error.retryAfterSeconds
      ? { retryAfterSeconds: result.error.retryAfterSeconds }
      : {}),
  };
}

function paymentEligibility(
  payment: ZeffyPayment,
  configuration: MembershipConfiguration,
): string | null {
  if (payment.currency !== configuration.expectedCurrency) {
    return `Payment currency must be ${configuration.expectedCurrency}.`;
  }
  if (payment.refundedAmountCents > 0 || payment.netAmountCents !== payment.amountCents) {
    return "Refunded payments cannot be assigned.";
  }
  return null;
}

function repositoryMutationError(error: RepositoryError): AdminMembershipError {
  if (error.code === "42501") {
    return { kind: "forbidden", message: "Administrator access is required." };
  }
  if (error.code === "P0002" || error.code === "PGRST116") {
    return { kind: "not_found", message: "The requested payment match was not found." };
  }
  if (error.code === "23505") {
    return {
      kind: "conflict",
      message: "That payment or member already has an active membership assignment.",
    };
  }
  return {
    kind: "data_unavailable",
    message: "The membership assignment could not be saved.",
  };
}

export async function getAdminMembershipWorkspace(
  includeMatched: boolean,
  dependencies: AdminMembershipDependencies,
): Promise<
  AdminMembershipResult<{
    configuration: MembershipConfiguration;
    payments: AdminPayment[];
    members: AdminMember[];
  }>
> {
  const authorization = await dependencies.authorizeAdmin();
  if (authorization.status !== "authorized") {
    return authorizationErrorResult(authorization);
  }

  const paymentResult = await dependencies.listPayments();
  if (!paymentResult.ok) {
    return { ok: false, error: providerError(paymentResult) };
  }

  const [memberResult, matchResult] = await Promise.all([
    dependencies.listMembers(),
    dependencies.listActiveMatches(),
  ]);
  if (!memberResult.ok || !matchResult.ok) {
    return {
      ok: false,
      error: { kind: "data_unavailable", message: "Membership records could not be loaded." },
    };
  }

  const matchesByPaymentId = new Map(
    matchResult.data.map((match) => [match.providerPaymentId, match]),
  );
  const membersById = new Map(memberResult.data.map((member) => [member.id, member]));
  const payments = paymentResult.data
    .map((payment): AdminPayment => {
      const activeMatch = matchesByPaymentId.get(payment.id) ?? null;
      const match = activeMatch
        ? { ...activeMatch, member: membersById.get(activeMatch.profileId) ?? null }
        : null;
      const eligibilityReason = paymentEligibility(payment, dependencies.configuration);
      return {
        id: payment.id,
        createdAt: payment.createdAt,
        amountCents: payment.amountCents,
        refundedAmountCents: payment.refundedAmountCents,
        netAmountCents: payment.netAmountCents,
        currency: payment.currency,
        refundStatus: payment.refundStatus,
        receiptUrl: payment.receiptUrl,
        buyer: payment.buyer,
        eligible: eligibilityReason === null,
        eligibilityReason,
        match,
      };
    })
    .filter((payment) => includeMatched || payment.match === null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return {
    ok: true,
    data: {
      configuration: dependencies.configuration,
      payments,
      members: memberResult.data,
    },
  };
}

export async function matchAdminMembershipPayment(
  input: { providerPaymentId?: unknown; profileId?: unknown },
  dependencies: AdminMembershipDependencies,
): Promise<AdminMembershipResult<{ matchId: string }>> {
  const providerPaymentId =
    typeof input.providerPaymentId === "string" ? input.providerPaymentId.trim() : "";
  const profileId = typeof input.profileId === "string" ? input.profileId.trim() : "";
  if (!providerPaymentId || providerPaymentId.length > 255 || !UUID_PATTERN.test(profileId)) {
    return {
      ok: false,
      error: { kind: "invalid_input", message: "A valid payment and member are required." },
    };
  }

  const authorization = await dependencies.authorizeAdmin();
  if (authorization.status !== "authorized") {
    return authorizationErrorResult(authorization);
  }

  const paymentResult = await dependencies.listPayments();
  if (!paymentResult.ok) {
    return { ok: false, error: providerError(paymentResult) };
  }
  const payment = paymentResult.data.find((candidate) => candidate.id === providerPaymentId);
  if (!payment) {
    return {
      ok: false,
      error: { kind: "not_found", message: "That Zeffy payment was not found." },
    };
  }

  const eligibilityReason = paymentEligibility(payment, dependencies.configuration);
  if (eligibilityReason) {
    return { ok: false, error: { kind: "conflict", message: eligibilityReason } };
  }

  const matchResult = await dependencies.matchPayment({
    payment,
    profileId,
    membershipPeriod: dependencies.configuration.membershipPeriod,
  });
  return matchResult.ok
    ? { ok: true, data: matchResult.data }
    : { ok: false, error: repositoryMutationError(matchResult.error) };
}

export async function unlinkAdminMembershipPayment(
  input: { matchId?: unknown; reason?: unknown },
  dependencies: AdminMembershipDependencies,
): Promise<AdminMembershipResult<{ paidMember: boolean }>> {
  const matchId = typeof input.matchId === "string" ? input.matchId.trim() : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!UUID_PATTERN.test(matchId) || reason.length > 500) {
    return {
      ok: false,
      error: { kind: "invalid_input", message: "A valid match and reason are required." },
    };
  }

  const authorization = await dependencies.authorizeAdmin();
  if (authorization.status !== "authorized") {
    return authorizationErrorResult(authorization);
  }

  const unlinkResult = await dependencies.unlinkPayment({
    matchId,
    reason: reason || null,
  });
  return unlinkResult.ok
    ? { ok: true, data: unlinkResult.data }
    : { ok: false, error: repositoryMutationError(unlinkResult.error) };
}
