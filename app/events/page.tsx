import { createPublicSupabase } from "@/lib/supabase-public";
import AdminEventControls from "@/components/events/admin-event-controls";

// Public, publicly-readable data (see "Events are viewable by everyone" RLS
// policy) — safe to cache and revalidate periodically instead of refetching
// on every single request.
export const revalidate = 60;

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
    created_at: string;
    status: "draft" | "published" | "cancelled";
};

export default async function EventsPage() {
    const supabase = createPublicSupabase();

    // Fetch published events from Supabase in chronological order.
    // Draft and cancelled events should not be visible on the public events page.
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Could not load events:", error);

        return (
            <main className="sase-page sase-member-page">
                <div className="sase-page-header">
                    <p className="sase-eyebrow">UCF SASE / Events</p>
                    <h1>Events</h1>
                </div>
                <section className="sase-content-section">
                    <p className="text-red-600 font-medium">Could not load events</p>
                    <p className="mt-2 text-sm text-gray-500">{error instanceof Error ? error.message : String(error)}</p>
                </section>
            </main>
        );
    }

    const events = (data ?? []) as Event[];

    return (
        <main className="sase-page sase-member-page">
            <div className="sase-page-header flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="sase-eyebrow">UCF SASE / Events</p>
                    <h1>Upcoming Events</h1>
                    <p className="mt-2 text-gray-500">See what&apos;s happening and get involved.</p>
                </div>
                <AdminEventControls />
            </div>

            <section className="sase-content-section">
                {events.length === 0 ? (
                    <div className="sase-form-card">
                        <p className="text-gray-500 font-medium text-center">No upcoming events right now. Check back soon!</p>
                    </div>
                ) : (
                    <div className="sase-form-grid">
                        {events.map((event) => (
                            <div key={event.id} className="sase-form-card flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h2 className="text-[#171d52] font-bold text-xl">{event.title}</h2>
                                        <span className="bg-[#e9eef8] text-[#344674] text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                            {event.points} pt{event.points === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    <p className="sase-eyebrow mb-3">{event.event_type}</p>
                                    
                                    {event.description && (
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
                                    )}

                                    <div className="flex flex-col gap-2 mt-4 border-t border-gray-100 pt-4">
                                        <div className="flex items-start gap-2 text-sm">
                                            <span className="font-semibold text-[#344674] min-w-[70px]">When:</span>
                                            <span className="text-gray-600">
                                                {new Date(event.start_time).toLocaleString(undefined, {
                                                    weekday: 'short', month: 'short', day: 'numeric',
                                                    hour: 'numeric', minute: '2-digit'
                                                })}
                                                {" - "}
                                                {new Date(event.end_time).toLocaleTimeString(undefined, {
                                                    hour: 'numeric', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <span className="font-semibold text-[#344674] min-w-[70px]">Where:</span>
                                            <span className="text-gray-600">{event.location ?? "TBA"}</span>
                                        </div>
                                        {event.host && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <span className="font-semibold text-[#344674] min-w-[70px]">Host:</span>
                                                <span className="text-gray-600">{event.host}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}