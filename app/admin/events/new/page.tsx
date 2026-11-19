import { getAdminHackathons } from "@/lib/hackathons";
import EventForm from "@/components/events/event-form";
import Link from "next/link";

// Hackathon options require the signed-in administrator's session, never build-time access.
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
    const hackathons = await getAdminHackathons();
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
                <EventForm hackathons={hackathons} />
            </div>
        </main>
    );
}
