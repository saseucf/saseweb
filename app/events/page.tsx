import { createPublicSupabase } from "@/lib/supabase-public";
import AdminEventControls from "@/components/events/admin-event-controls";
import EventsClient from "@/components/events/events-client";

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
                <EventsClient events={events} />
            </section>


            {/* Past Events */}
            <PastEvents />
        </main>
    );
}

function PastEvents() {
    const gbm1Images = [
        "/events/gbm1-1.JPG",
        "/events/gbm1-2.JPG",
        "/events/gbm1-3.JPG",
        "/events/gbm1-4.JPG",
        "/events/gbm1-5.JPG",
        "/events/gbm1-6.JPG",
    ];
    const menmetImages = [
        "/events/menmet-1.png",
        "/events/menmet-2.png",
        "/events/menmet-3.png",
        "/events/menmet-4.png",
        "/events/menmet-6.png",
    ];
    const gbm2Images = [
        "/events/gbm2-1.JPG",
        "/events/gbm2-2.JPG",
        "/events/gbm2-3.JPG",
        "/events/gbm2-4.JPG",
        "/events/gbm2-5.JPG",
        "/events/gbm2-6.JPG",
        "/events/gbm2-7.JPG",
    ];

    return (
        <section className="sase-content-section pb-16">
            <h2 className="text-[#141b4d] font-black mb-2">Past Events</h2>
            <p className="sase-eyebrow mb-8">2024–2025</p>

            <EventGallery title="GBM #1: Despicable SASE" images={gbm1Images} alt="GBM1" />
            <EventGallery title="Mentor-Mentee Speed Friending" images={menmetImages} alt="Mentor-Mentee" />
            <EventGallery title="GBM #2: SASE Crossing" images={gbm2Images} alt="GBM2" />
        </section>
    );
}

function EventGallery({ title, images, alt }: { title: string; images: string[]; alt: string }) {
    return (
        <div className="mb-12">
            <h3 className="text-[#89abe3] font-black text-xl uppercase tracking-wide mb-4">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={i}
                        src={src}
                        alt={`${alt} ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-[#dbe2f0] hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                    />
                ))}
            </div>
        </div>
    );
}