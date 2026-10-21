import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { reconcileEmailMemberships } from "@/lib/membership-email-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Sign in to verify payment." }, { status: 401 });
    const profile = await supabase.from("profiles").select("paid_member").eq("id", user.id).single();
    if (profile.error) return NextResponse.json({ error: "Profile could not be loaded." }, { status: 503 });
    if (profile.data.paid_member) return NextResponse.json({ success: true });
    await reconcileEmailMemberships({ userId: user.id, email: user.email });
    const refreshed = await supabase.from("profiles").select("paid_member").eq("id", user.id).single();
    if (refreshed.error) throw new Error("Membership status could not be loaded.");
    return NextResponse.json({ success: refreshed.data.paid_member, message: refreshed.data.paid_member ? "Payment verified." : "No available payment matches your registered email. An officer can review payments made with another email." });
  } catch {
    return NextResponse.json({ error: "Payment verification is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
