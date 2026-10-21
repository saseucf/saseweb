import { normalizeMajor } from "@/lib/majors";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { createAdminSupabase } from "@/lib/supabase-server";
import { membersCsv } from "@/lib/member-tools";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getAdminAuthorization();
  if (auth.status !== "authorized") return Response.json({ error: "Administrator access required." }, { status: auth.status === "unauthenticated" ? 401 : 403 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Attendance export is not configured." }, { status: 503 });
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (eventId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) return Response.json({ error: "Invalid event." }, { status: 400 });
  const rows: Record<string, unknown>[] = [];
  const admin = createAdminSupabase();
  for (let offset = 0; ; offset += 1000) {
    let query = admin.from("event_attendances").select("id, event_id, user_id, checked_in_at, feedback_rating, feedback_text, profiles(first_name, last_name, email, major, year), events(title, points)").order("id").range(offset, offset + 999);
    if (eventId) query = query.eq("event_id", eventId);
    const { data, error } = await query;
    if (error) return Response.json({ error: "Unable to export attendance." }, { status: 503 });
    for (const attendance of data) {
      const profile = Array.isArray(attendance.profiles) ? attendance.profiles[0] : attendance.profiles;
      const event = Array.isArray(attendance.events) ? attendance.events[0] : attendance.events;
      rows.push({ attendance_id: attendance.id, event_id: attendance.event_id, event: event?.title, member_id: attendance.user_id, first_name: profile?.first_name, last_name: profile?.last_name, email: profile?.email, major: normalizeMajor(profile?.major), graduation_year: profile?.year, points: event?.points, checked_in_at: attendance.checked_in_at, feedback_rating: attendance.feedback_rating, feedback_text: attendance.feedback_text });
    }
    if (data.length < 1000) break;
  }
  return new Response(membersCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="sase-attendance.csv"', "Cache-Control": "no-store" } });
}
