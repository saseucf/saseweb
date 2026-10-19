import { loadPublicLeaderboard } from "@/lib/leaderboard-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await loadPublicLeaderboard();
  const headers = { "Cache-Control": "no-store, max-age=0" };
  if (result.error) return Response.json({ error: "Rankings are temporarily unavailable." }, { status: 503, headers });
  return Response.json({ entries: result.entries }, { headers });
}
