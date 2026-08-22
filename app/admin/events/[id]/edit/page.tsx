import EventForm from "@/components/events/event-form";
import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

type EditEventPageProps = {
    params: Promise<{
        id: string;
    }>;
};

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
        <main className="min-h-screen p-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-3xl font-bold">
                    Edit Event
                </h1>

                <div className="mt-8">
                    <EventForm event={event} />
                </div>
            </div>
        </main>
    );
}