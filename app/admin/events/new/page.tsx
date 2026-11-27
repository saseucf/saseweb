import EventForm from "@/components/events/event-form";
import Link from "next/link";

export default function NewEventPage() {
    return (
        <main className="sase-page sase-admin-page pt-[120px]">
            <Link href="/admin/events" className="sase-secondary-button mb-6 inline-block">
                &larr; Back to Events
            </Link>
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                <h1>Create Event</h1>
            </div>

            <div className="sase-creator-panel mt-8">
                <EventForm />
            </div>
        </main>
    );
}