import { createHash } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase-server";
import { parseMemberInput } from "@/lib/member-tools";
import { onboardMember } from "@/lib/member-onboarding";
import { guestCheckinIsOpen, registerGuestAttendance } from "@/lib/guest-checkin-core";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Use a JSON request." }, { status: 415 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json({ error: "Guest check-in is temporarily unavailable. Please ask an officer." }, { status: 503 });
  let input, eventId;
  try {
    const body = await request.json();
    input = parseMemberInput(body);
    eventId = body.eventId;
    if (typeof eventId !== "string" || !/^[0-9a-f-]{36}$/i.test(eventId)) throw new Error("Invalid event.");
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const admin = createAdminSupabase();
  const { data: event, error } = await admin.from("events").select("id, start_time, end_time, status").eq("id", eventId).single();
  if (error || !event) return Response.json({ error: "Event not found. Please scan the event QR code again." }, { status: 404 });
  if (!guestCheckinIsOpen(event)) return Response.json({ error: "This event has been cancelled." }, { status: 400 });
  // Hosting providers populate this header; it is an additional shared-network
  // budget, while the per-email budget always applies, including local development.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) {
    const fingerprint = `ip:${createHash("sha256").update(ip).digest("hex")}`;
    const { data: ipAllowed, error: ipError } = await admin.rpc("claim_guest_checkin_attempt", { fingerprint });
    if (ipError) return Response.json({ error: "Guest check-in is not configured. Please ask an officer." }, { status: 503 });
    if (!ipAllowed) return Response.json({ error: "This network has made too many attempts. Please ask an officer to check you in." }, { status: 429 });
  }
  const fingerprint = createHash("sha256").update(input.email).digest("hex");
  const { data: allowed, error: rateError } = await admin.rpc("claim_guest_checkin_attempt", { fingerprint });
  if (rateError) return Response.json({ error: "Guest check-in is not configured. Please ask an officer." }, { status: 503 });
  if (!allowed) return Response.json({ error: "Too many attempts. Please wait ten minutes or ask an officer." }, { status: 429 });
  try {
    const result = await registerGuestAttendance(input, {
      onboard: input => onboardMember(input, new URL(request.url).origin),
      attend: async id => admin.from("event_attendances").insert({ event_id: eventId, user_id: id }),
    });
    return Response.json(result);
  } catch (error) { return Response.json({ error: (error as Error).message }, { status: 503 }); }
}
