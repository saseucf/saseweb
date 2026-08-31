import { redirect } from "next/navigation";
import { getMembershipCheckoutConfiguration } from "@/lib/membership-checkout";
import { createServerSupabase } from "@/lib/supabase-server";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const supabase = createServerSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login?redirect=/profile");

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone_number, major, school, year, paid_member, role, wants_email_notifications")
        .eq("id", user.id)
        .single();

    const { data: rawAttendances } = await supabase
        .from("event_attendances")
        .select(`
            event_id,
            events ( id, title, start_time, event_type, points )
        `)
        .eq("user_id", user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attendances = (rawAttendances || []).map((row: any) => ({
        event_id: row.event_id,
        events: Array.isArray(row.events) ? row.events[0] : row.events
    }));

    if (error || !profile) {
        return (
            <main className="sase-page pt-[120px]">
                <div className="sase-page-header">
                    <p className="sase-eyebrow !text-[#4266a4] dark:!text-[#89abe3]">UCF SASE / Profile</p>
                    <h1>Member Profile</h1>
                </div>
                <section className="sase-content-section flex items-start gap-4 border border-destructive/35 bg-destructive/10 p-5" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle mt-0.5 size-5 shrink-0 text-destructive"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    <div>
                        <h2 className="font-bold">Profile unavailable</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            Your profile could not be loaded. Refresh the page or try again later.
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    const checkout = getMembershipCheckoutConfiguration({
        checkoutUrl: "https://www.zeffy.com/en-US/ticketing/society-of-asian-scientists-and-engineerss-memberships",
        membershipPeriod: "2026-2027",
        amountCents: "2500",
        currency: "USD",
    });

    return <ProfileClient initialProfile={profile} checkout={checkout} initialAttendances={attendances || []} />;
}
