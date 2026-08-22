import { createServerSupabase } from "@/lib/supabase-server";
import AdminEventControls from "@/components/events/admin-event-controls";

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
    const supabase = createServerSupabase();

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
            <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Events</h1>

            <div className="mt-6 rounded-lg border border-destructive p-4">
                <p className="font-medium text-destructive">
                Could not load events
                </p>

                <p className="mt-2 text-sm">
                {error instanceof Error ? error.message : String(error)}
                </p>
            </div>
            </main>
        );
    }

    const events = (data ?? []) as Event[];

    return (
        <main className="min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Events</h1>

                <AdminEventControls />
            </div>

            <p className="mt-2 text-muted-foreground">
            Temporary public event list.
            </p>

            {events.length === 0 ? (
            <div className="mt-8 rounded-lg border p-6">
                <p>No events were found in Supabase.</p>
            </div>
            ) : (
            <div className="mt-8 grid gap-4">
                {events.map((event) => (
                <article
                    key={event.id}
                    className="rounded-lg border bg-card p-5 text-card-foreground"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                        {event.title}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                        {event.event_type}
                        </p>
                    </div>

                    <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                        {event.points} point{event.points === 1 ? "" : "s"}
                    </span>
                    </div>

                    {event.description && (
                    <p className="mt-4">{event.description}</p>
                    )}

                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="font-medium">Starts</dt>
                        <dd className="text-muted-foreground">
                        {new Date(event.start_time).toLocaleString()}
                        </dd>
                    </div>

                    <div>
                        <dt className="font-medium">Ends</dt>
                        <dd className="text-muted-foreground">
                        {new Date(event.end_time).toLocaleString()}
                        </dd>
                    </div>

                    <div>
                        <dt className="font-medium">Location</dt>
                        <dd className="text-muted-foreground">
                        {event.location ?? "Not specified"}
                        </dd>
                    </div>

                    <div>
                        <dt className="font-medium">Host</dt>
                        <dd className="text-muted-foreground">
                        {event.host ?? "Not specified"}
                        </dd>
                    </div>
                    </dl>
                </article>
                ))}
            </div>
            )}
        </div>
        </main>
    );
}