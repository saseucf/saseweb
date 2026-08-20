import EventForm from "@/components/events/event-form";

export default function NewEventPage() {
    return (
        <main className="min-h-screen p-8">
        <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold">Create Event</h1>

            <div className="mt-8">
            <EventForm />
            </div>
        </div>
        </main>
    );
}