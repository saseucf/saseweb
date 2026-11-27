import EventForm from "@/components/events/event-form";
import Link from "next/link";

export default function NewEventPage() {
    return (
        <main className="sase-page sase-admin-page sase-event-editor">
            <header className="sase-event-editor-header">
                <h1>Create Event</h1>
                <Link href="/admin/events" className="sase-secondary-button">
                    &larr; Back to Events
                </Link>
            </header>
            <div className="sase-creator-panel">
                <EventForm />
            </div>
        </main>
    );
}