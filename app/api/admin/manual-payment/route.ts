import { NextResponse } from "next/server";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const supabase = createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ ok: false, error: { kind: "unauthorized", message: "Unauthorized" } }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role?.trim().toLowerCase() !== "admin") {
            return NextResponse.json({ ok: false, error: { kind: "forbidden", message: "Forbidden" } }, { status: 403 });
        }

        const { profileId } = await req.json();
        if (!profileId) {
            return NextResponse.json({ ok: false, error: { kind: "invalid_input", message: "Missing profileId" } }, { status: 400 });
        }

        const adminSupabase = createAdminSupabase();
        
        // Update the user's profile to paid_member = true
        const { error: updateError } = await adminSupabase
            .from("profiles")
            .update({ paid_member: true })
            .eq("id", profileId);

        if (updateError) {
            return NextResponse.json({ ok: false, error: { kind: "database_error", message: "Failed to update member status" } }, { status: 500 });
        }

        revalidatePath("/admin/membership");

        return NextResponse.json({ ok: true, data: { success: true } });
        
    } catch (e: unknown) {
        return NextResponse.json({ ok: false, error: { kind: "server_error", message: (e as Error).message } }, { status: 500 });
    }
}
