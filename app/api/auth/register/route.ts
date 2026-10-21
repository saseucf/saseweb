import { createAdminSupabase } from "@/lib/supabase-server";
import { registerMember } from "@/lib/member-registration";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Use a JSON request." }, { status: 415 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Account creation is temporarily unavailable." }, { status: 503 });
  let body;
  try {
    const text = await request.text();
    if (text.length > 16384) return Response.json({ error: "Request too large." }, { status: 413 });
    body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch { return Response.json({ error: "Invalid account details." }, { status: 400 }); }
  try {
    const admin = createAdminSupabase();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const result = await registerMember(body, ip, {
      claimAttempt: async fingerprint => admin.rpc("claim_guest_checkin_attempt", { fingerprint }),
      createUser: input => admin.auth.admin.createUser(input),
    });
    return Response.json(result, { status: result.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid account details." }, { status: 400 });
  }
}
