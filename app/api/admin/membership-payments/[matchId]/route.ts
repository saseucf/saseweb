import {
  authorizationErrorResult,
  unlinkAdminMembershipPayment,
} from "@/lib/admin-membership-core";
import { adminMembershipResponse, notConfiguredResponse } from "@/lib/admin-membership-http";
import {
  createAdminMembershipDependencies,
  getAdminAuthorization,
  getMembershipConfiguration,
} from "@/lib/admin-membership";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
  const authorization = await getAdminAuthorization();
  if (authorization.status !== "authorized") {
    return adminMembershipResponse(authorizationErrorResult(authorization));
  }
  const configuration = getMembershipConfiguration();
  if (!configuration.ok) return notConfiguredResponse(configuration.missing);

  const { matchId } = await context.params;
  const body = (await request.json().catch(() => null)) as unknown;
  const reason =
    typeof body === "object" && body !== null
      ? (body as { reason?: unknown }).reason
      : undefined;
  const result = await unlinkAdminMembershipPayment(
    { matchId, reason },
    createAdminMembershipDependencies(configuration.configuration, authorization),
  );
  return adminMembershipResponse(result);
}
