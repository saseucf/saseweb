import { getAdminAuthorization } from "@/lib/admin-membership";
import { createAdminSupabase } from "@/lib/supabase-server";
import { membersCsv, parseMemberInput } from "@/lib/member-tools";
import { onboardMember } from "@/lib/member-onboarding";

export const dynamic = "force-dynamic";

async function authorize() {
  const auth = await getAdminAuthorization();
  if (auth.status !== "authorized") return Response.json({ error: "Administrator access required." }, { status: auth.status === "unauthenticated" ? 401 : 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Member management is not configured." }, { status: 503 });
}

export async function GET() {
  const denied = await authorize();
  if (denied) return denied;
  const admin = createAdminSupabase();
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.from("profiles").select("*").order("id").range(offset, offset + 999);
    if (error) return Response.json({ error: "Unable to export members." }, { status: 503 });
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return new Response(membersCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="sase-members.csv"', "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const denied = await authorize();
  if (denied) return denied;
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Use a JSON request." }, { status: 415 });
  let input;
  try { input = parseMemberInput(await request.json()); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  try {
    const result = await onboardMember(input, new URL(request.url).origin);
    return Response.json({ ...result, message: !result.created ? "This email already belongs to a member." : result.emailSent ? "Member added. Welcome email sent." : "Member added, but the welcome email could not be sent. They can use Forgot password to access their account." });
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 503 }); }
}
