import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import EventActions from "@/components/events/event-actions";

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

            <section className="sase-content-section">
                {events.length === 0 ? (
                    <div className="sase-form-card">
                        <p className="text-gray-500 font-medium text-center">No events have been created yet.</p>
                    </div>
                ) : (
                    <div className="sase-form-grid">
                        {events.map((event) => (
                            <div key={event.id} className="sase-form-card flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h2 className="text-[#141b4d] font-bold text-xl">
                                            {event.title}
                                        </h2>
                                        <span className={`px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded ${
                                            event.status === 'published' ? 'bg-green-100 text-green-700' :
                                            event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {event.status}
                                        </span>
                                    </div>
                                    
                                    <p className="sase-eyebrow mb-3">{event.event_type}</p>

                                    <div className="flex flex-col gap-1 mt-4 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="font-semibold text-[#344674] min-w-[50px]">Time:</span>
                                            <span className="text-gray-600">
                                                {new Date(event.start_time).toLocaleString(undefined, {
                                                    weekday: 'short', month: 'short', day: 'numeric',
                                                    hour: 'numeric', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="font-semibold text-[#344674] min-w-[50px]">Place:</span>
                                            <span className="text-gray-600">
                                                {event.location ?? "Not specified"}
                                            </span>
                                        </div>
                                        {event.forms && event.forms.length > 0 && (
                                            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                                                <span className="font-semibold text-[#344674] min-w-[50px]">Forms:</span>
                                                <span className="text-gray-600 flex flex-col gap-1">
                                                    {event.forms.map(f => (
                                                        <Link key={f.id} href={`/forms/admin/responses?id=${f.id}`} className="text-blue-500 hover:underline">
                                                            {f.title}
                                                        </Link>
                                                    ))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                                    <Link
                                        href={`/admin/events/${event.id}/edit`}
                                        className="sase-secondary-button flex-1 text-center"
                                        style={{ padding: '8px 12px', fontSize: '0.65rem' }}
                                    >
                                        Edit
                                    </Link>

                                    <Link
                                        href={`/checkin/admin/event/${event.id}/qr`}
                                        className="sase-primary-button flex-1 text-center"
                                        style={{ padding: '8px 12px', fontSize: '0.65rem' }}
                                    >
                                        QR Code
                                    </Link>

                                    <Link
                                        href={`/admin/events/${event.id}/rsvps`}
                                        className="sase-secondary-button flex-1 text-center"
                                        style={{ padding: '8px 12px', fontSize: '0.65rem' }}
                                    >
                                        RSVP List
                                    </Link>

                                    <EventActions
                                        eventId={event.id}
                                        status={event.status}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}