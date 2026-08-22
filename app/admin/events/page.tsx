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
};

export default async function AdminEventsPage() {
    const supabase = createServerSupabase();

    // Admin view includes events of every status.
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Could not load admin events:", error);

        return (
            <main className="min-h-screen p-8">
                <h1 className="text-3xl font-bold">Manage Events</h1>

                <p className="mt-6 text-destructive">
                    Could not load events.
                </p>
            </main>
        );
    }

    const events = (data ?? []) as Event[];

    return (
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Manage Events
                        </h1>

                        <p className="mt-2 text-muted-foreground">
                            Create and manage SASE events.
                        </p>
                    </div>

                    <Link
                        href="/admin/events/new"
                        className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
                    >
                        Create Event
                    </Link>
                </div>

                {events.length === 0 ? (
                    <div className="mt-8 rounded-lg border p-6">
                        <p>No events have been created yet.</p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-4">
                        {events.map((event) => (
                            <article
                                key={event.id}
                                className="rounded-lg border p-5"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-xl font-semibold">
                                                {event.title}
                                            </h2>

                                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">
                                                {event.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {event.event_type}
                                        </p>

                                        <p className="mt-3 text-sm">
                                            {new Date(
                                                event.start_time
                                            ).toLocaleString()}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {event.location ??
                                                "Location not specified"}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <Link
                                            href={`/admin/events/${event.id}/edit`}
                                            className="rounded-md border px-3 py-2 text-sm font-medium"
                                        >
                                            Edit
                                        </Link>

                                        <EventActions
                                            eventId={event.id}
                                            status={event.status}
                                        />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}