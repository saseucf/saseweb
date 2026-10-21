import { createAdminSupabase, createServerSupabase } from "@/lib/supabase-server";
import { claimMemberWorkshopCredit } from "@/lib/workshop-credit-repository";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const { data: { user }, error } = await createServerSupabase().auth.getUser();
  if (error || !user) return Response.json({ error: "Sign in to claim workshop credit." }, { status: 401 });
  try {
    return Response.json(await claimMemberWorkshopCredit(createAdminSupabase(), user.id), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Workshop credit could not be checked. Your credit will remain available; please try again." }, { status: 503 });
  }
}
