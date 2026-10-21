import { NextResponse } from "next/server";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { authorizationErrorResult } from "@/lib/admin-membership-core";
import { adminMembershipResponse } from "@/lib/admin-membership-http";
import { reconcileEmailMemberships } from "@/lib/membership-email-server";

export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ ok: false, error: { kind: "forbidden", message: "Invalid request origin." } }, { status: 403 });
  const authorization = await getAdminAuthorization();
  if (authorization.status !== "authorized") return adminMembershipResponse(authorizationErrorResult(authorization));
  try {
    return NextResponse.json({ ok: true, data: await reconcileEmailMemberships({ adminId: authorization.adminId }) });
  } catch {
    return NextResponse.json({ ok: false, error: { kind: "data_unavailable", message: "Automatic email matching is temporarily unavailable. Refresh to try again." } }, { status: 503 });
  }
}
