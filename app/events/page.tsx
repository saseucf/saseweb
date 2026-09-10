import Image from "next/image";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase-public";
import AdminEventControls from "@/components/events/admin-event-controls";
import EventsClient from "@/components/events/events-client";
import type { PublicEvent } from "@/components/events/event-display";
import styles from "./events.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-events-ui", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-events-body", display: "swap" });

export const metadata = {
    title: "Events | UCF SASE",
    description: "Find your next UCF SASE workshop, social, or general body meeting. Browse the schedule and explore moments from past events.",
};

// Published event records are public under the existing RLS policy.
export const revalidate = 60;

const albums = [
    { title: "GBM #1: Despicable SASE", images: [1, 2, 3, 4, 5, 6].map(n => `/events/gbm1-${n}.JPG`) },
    { title: "Mentor-Mentee Speed Friending", images: [1, 2, 3, 4, 6].map(n => `/events/menmet-${n}.png`) },
    { title: "GBM #2: SASE Crossing", images: [1, 2, 3, 4, 5, 6, 7].map(n => `/events/gbm2-${n}.JPG`) },
];

export default async function EventsPage() {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
        .from("events")
        .select("*, forms(slug, is_open)")
        .eq("status", "published")
        .order("start_time", { ascending: true });

    if (error) console.error("Could not load events:", error);

    return (
        <main className={`${styles.page} ${inter.variable} ${outfit.variable}`}>
            <header className={styles.hero}>
                <div className={`${styles.container} ${styles.heroLayout}`}>
                    <div className={styles.heroCopy}>
                        <p className={styles.eyebrow}>Events</p>
                        <h1>Make time<br />for SASE.</h1>
                        <p>Workshops, socials, and chapter meetings.</p>
                        <a href="#schedule" className={styles.heroLink}>Find an event <ArrowDown size={18} aria-hidden="true" /></a>
                    </div>
                    <figure className={styles.heroPhoto}>
                        <Image src="/events/gbm2-1.JPG" alt="SASE members catching up at the SASE Crossing general body meeting" width={5712} height={4284} sizes="(min-width: 1024px) 540px, (min-width: 768px) 45vw, calc(100vw - 40px)" priority />
                    </figure>
                </div>
            </header>

            <section id="schedule" className={`${styles.container} ${styles.schedule}`} aria-labelledby="schedule-heading">
                <div className={styles.sectionHeading}>
                    <div><h2 id="schedule-heading">Schedule</h2><p>All event times are Eastern.</p></div>
                    <div className={styles.adminControls}><AdminEventControls /></div>
                </div>
                {error ? (
                    <div className={styles.emptyState} role="alert">
                        <h3>The schedule couldn&apos;t load.</h3>
                        <p>Try again in a moment, or contact us for help.</p>
                        {/* A full document retry also retries the server data request. */}
                        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                        <a href="/events" className={styles.primaryLink}>Try again</a>
                        <Link href="/contact" className={styles.textLink}>Contact SASE <ArrowUpRight size={18} aria-hidden="true" /></Link>
                    </div>
                ) : <EventsClient events={(data ?? []) as PublicEvent[]} initialNow={new Date().toISOString()} />}
            </section>

            <section id="event-photos" className={styles.memories} data-event-motion="position" aria-labelledby="photos-heading">
                <div className={styles.container}>
                    <div className={styles.sectionHeading}>
                        <div><h2 id="photos-heading">You had to be there.</h2><p>Chapter moments, 2024–2025.</p></div>
                    </div>
                    <div className={styles.albums}>
                        {albums.map(album => (
                            <details key={album.title} className={styles.album}>
                                <summary>
                                    <div className={styles.albumCover}><Image src={album.images[0]} alt={`A moment from ${album.title}`} width={1200} height={900} sizes="(min-width: 768px) 36vw, calc(100vw - 40px)" loading="eager" /></div>
                                    <div className={styles.albumLabel}><h3>{album.title}</h3><Plus size={22} aria-hidden="true" /></div>
                                    <span className={styles.albumCount}>{album.images.length} photos</span>
                                </summary>
                                <div className={styles.albumPhotos}>
                                    {album.images.map((src, index) => (
                                        <a href={src} target="_blank" rel="noopener noreferrer" key={src} aria-label={`Open ${album.title}, photo ${index + 1} in a new tab`}>
                                            <Image src={src} alt={`${album.title}, photo ${index + 1} of ${album.images.length}`} width={900} height={675} sizes="(min-width: 768px) 20vw, 45vw" />
                                        </a>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
