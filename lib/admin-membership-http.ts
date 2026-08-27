import type {
  AdminMembershipError,
  AdminMembershipResult,
} from "@/lib/admin-membership-core";

const STATUS_BY_KIND: Record<AdminMembershipError["kind"], number> = {
  unauthenticated: 401,
  forbidden: 403,
  invalid_input: 400,
  not_configured: 503,
  provider_unavailable: 502,
  data_unavailable: 503,
  not_found: 404,
  conflict: 409,
};

export function adminMembershipResponse<T>(result: AdminMembershipResult<T>): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (result.ok) return Response.json({ ok: true, data: result.data }, { headers });

  if (result.error.retryAfterSeconds) {
    headers.set("Retry-After", String(result.error.retryAfterSeconds));
  }
  return Response.json(
    { ok: false, error: { kind: result.error.kind, message: result.error.message } },
    { status: STATUS_BY_KIND[result.error.kind], headers },
  );
}

export function notConfiguredResponse(missing: string[]): Response {
  return Response.json(
    {
      ok: false,
      error: {
        kind: "not_configured",
        message: "Membership payment reconciliation is not configured.",
        missing,
      },
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
