import { REMINDER_ROUTES } from "@/lib/event-groups";
import Link from "next/link";
import { redirect } from "next/navigation";
import EventGroupForm from "@/components/events/event-group-form";
import { getAdminAuthorization } from "@/lib/admin-membership";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function EventGroupsPage() {
    const auth = await getAdminAuthorization();
    if (auth.status === "unauthenticated") redirect("/login");
    if (auth.status !== "authorized") redirect("/admin/events");

    const { data: groups, error } = await createServerSupabase()
        .from("event_groups")
        .select("id, name, discord_channel_id, discord_role_id")
        .order("name");

    return (
        <main className="sase-page sase-admin-page pt-[120px]">
            <Link href="/admin/events" className="sase-secondary-button mb-6 inline-block">
                &larr; Back to Events
            </Link>
            <div className="sase-page-header">
                <h1>Discord reminder channels</h1>
                <p>Service, Social, and Fundraiser events use their respective channels. Workshops follow their subcategory. Other events use General.</p>
            </div>
            {error ? (
                <p className="mt-8 text-red-600" role="alert">Could not load event groups. Refresh the page and try again.</p>
            ) : (
                <section className="sase-content-section sase-form-grid">
                    {REMINDER_ROUTES.map(name => (
                        <EventGroupForm key={name} name={name} group={groups?.find(group => group.name === name)} />
                    ))}
                </section>
            )}
        </main>
    );
}
