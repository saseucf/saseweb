import {
  authorizationErrorResult,
  getAdminMembershipWorkspace,
  matchAdminMembershipPayment,
} from "@/lib/admin-membership-core";
import { adminMembershipResponse, notConfiguredResponse } from "@/lib/admin-membership-http";
import {
  createAdminMembershipDependencies,
  getAdminAuthorization,
  getMembershipConfiguration,
} from "@/lib/admin-membership";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await getAdminAuthorization();
  if (authorization.status !== "authorized") {
    return adminMembershipResponse(authorizationErrorResult(authorization));
  }
  const configuration = getMembershipConfiguration();
  if (!configuration.ok) return notConfiguredResponse(configuration.missing);

  const includeMatched = new URL(request.url).searchParams.get("includeMatched") === "true";
  const result = await getAdminMembershipWorkspace(
    includeMatched,
    createAdminMembershipDependencies(configuration.configuration, authorization),
  );
  return adminMembershipResponse(result);
}

export async function POST(request: Request) {
  const authorization = await getAdminAuthorization();
  if (authorization.status !== "authorized") {
    return adminMembershipResponse(authorizationErrorResult(authorization));
  }
  const configuration = getMembershipConfiguration();
  if (!configuration.ok) return notConfiguredResponse(configuration.missing);

  const body = (await request.json().catch(() => null)) as unknown;
  const input =
    typeof body === "object" && body !== null
      ? (body as { providerPaymentId?: unknown; profileId?: unknown })
      : {};
  const result = await matchAdminMembershipPayment(
    input,
    createAdminMembershipDependencies(configuration.configuration, authorization),
  );
  
  if (result.ok) {
    revalidatePath("/admin/membership");
  }

  return adminMembershipResponse(result);
}
