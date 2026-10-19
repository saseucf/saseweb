import { getAdminAuthorization } from "@/lib/admin-membership";
import { loadPublicLeaderboard } from "@/lib/leaderboard-server";
import { membersCsv } from "@/lib/member-tools";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAdminAuthorization();
  if (auth.status !== "authorized") return Response.json({ error: "Administrator access required." }, { status: auth.status === "unauthenticated" ? 401 : auth.status === "unavailable" ? 503 : 403, headers: { "Cache-Control": "no-store" } });
  const result = await loadPublicLeaderboard();
  if (result.error) return Response.json({ error: "Rankings are temporarily unavailable." }, { status: 503 });
  return new Response(membersCsv(result.entries.map(entry => ({ rank: entry.rank, name: entry.name, participation_points: entry.total_points }))), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="sase-top-10.csv"', "Cache-Control": "no-store" },
  });
}
