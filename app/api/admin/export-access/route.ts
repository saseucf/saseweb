import { getAdminAuthorization } from "@/lib/admin-membership";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAdminAuthorization();
  return Response.json({ isAdmin: auth.status === "authorized" }, {
    status: auth.status === "authorized" ? 200 : auth.status === "unauthenticated" ? 401 : auth.status === "unavailable" ? 503 : 403,
    headers: { "Cache-Control": "no-store" },
  });
}
