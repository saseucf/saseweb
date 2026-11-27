import EventForm from "@/components/events/event-form";
import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

type EditEventPageProps = {
    params: Promise<{
        id: string;
    }>;
};

import Link from "next/link";

export default async function EditEventPage({
    params,
}: EditEventPageProps) {
    const { id } = await params;
    const supabase = createServerSupabase();

    // Load the event being edited.
    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !event) {
        console.error("Could not load event:", error);
        notFound();
    }

    return (
        <main className="sase-page sase-admin-page pt-[120px]">
            <Link href="/admin/events" className="sase-secondary-button mb-6 inline-block">
                &larr; Back to Events
            </Link>
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                <h1>Edit Event</h1>
            </div>

            <div className="sase-creator-panel mt-8">
                <EventForm event={event} />
            </div>
        </main>
    );
}