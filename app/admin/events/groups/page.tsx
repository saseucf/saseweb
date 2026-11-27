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
                <h1>Discord event groups</h1>
                <p>Assign a group when editing an event to include it in that group&apos;s Discord digests.</p>
            </div>
            {error ? (
                <p className="mt-8 text-red-600" role="alert">Could not load event groups. Refresh the page and try again.</p>
            ) : (
                <>
                    <section className="sase-content-section">
                        <h2 className="mb-4 text-xl font-bold">New group</h2>
                        <EventGroupForm />
                    </section>
                    {!!groups?.length && (
                        <section className="sase-content-section">
                            <h2 className="mb-4 text-xl font-bold">Existing groups</h2>
                            <div className="sase-form-grid !mt-0">
                                {groups.map(group => <EventGroupForm key={group.id} group={group} />)}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}
