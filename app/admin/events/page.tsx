import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import AdminEventsClient from "@/components/events/admin-events-client";

export const dynamic = "force-dynamic";

type Event = {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    location: string | null;
    start_time: string;
    end_time: string;
    capacity: number | null;
    points: number;
    host: string | null;
    status: "draft" | "published" | "cancelled";
    created_at: string;
    forms?: { id: string, title: string }[];
    checkin_count?: number;
};

export default async function AdminEventsPage() {
    const supabase = createServerSupabase();

    // Fetch events
    const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

    // Fetch forms to link manually
    const { data: formsData } = await supabase
        .from("forms")
        .select("id, title, event_id")
        .not("event_id", "is", null);

    // Fetch check-in counts
    const { data: attendancesData } = await supabase
        .from("event_attendances")
        .select("event_id");

    if (eventsError) {
        console.error("Could not load admin events:", eventsError);

        return (
            <main className="sase-page sase-admin-page">
                <div className="sase-page-header">
                    <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                    <h1>Manage Events</h1>
                </div>
                <section className="sase-content-section">
                    <p className="text-red-600 font-medium">Could not load events.</p>
                </section>
            </main>
        );
    }

    const events = (eventsData ?? []) as Event[];

    const checkinCounts: Record<string, number> = {};
    if (attendancesData) {
        attendancesData.forEach(att => {
            if (att.event_id) {
                checkinCounts[att.event_id] = (checkinCounts[att.event_id] || 0) + 1;
            }
        });
    }

    events.forEach(event => {
        event.checkin_count = checkinCounts[event.id] || 0;
    });

    // Manually map forms to events
    if (formsData) {
        events.forEach(event => {
            event.forms = formsData
                .filter(form => form.event_id === event.id)
                .map(form => ({ id: form.id, title: form.title }));
        });
    }

    return (
        <main className="sase-page sase-admin-page pt-[120px]">
            <div className="sase-page-header flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                    <h1>Manage Events</h1>
                    <p className="mt-2 text-gray-500">Create, edit, and launch events.</p>
                </div>

                <div className="flex gap-3 mt-4 sm:mt-0">
                    <Link
                        href="/forms/admin"
                        className="sase-secondary-button"
                    >
                        Forms Dashboard
                    </Link>
                    <Link
                        href="/admin/events/new"
                        className="sase-primary-button"
                    >
                        + Create Event
                    </Link>
                </div>
            </div>

            <AdminEventsClient events={events} />
        </main>
    );
}