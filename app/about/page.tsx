import { createServerSupabase } from "@/lib/supabase-server";
import AwardsTimeline from "@/components/AwardsTimeline";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Inter, Outfit } from "next/font/google";
import styles from "./about.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-about-ui", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-about-body", display: "swap" });

export const metadata = {
    title: "About – UCF SASE",
    description: "Get to know UCF SASE: our community, our mission, and the milestones we've reached together. All backgrounds and majors are welcome.",
};

// Brand colors to assign dynamically to the top majors
const BRAND_CLASSES = [
    "bg-[#141b4d] dark:bg-[#89abe3]",
    "bg-[#89abe3] dark:bg-[#a8c3f2]",
    "bg-[#dbc8b6] dark:bg-[#dbc8b6]",
    "bg-[#26355f] dark:bg-[#6888c8]",
    "bg-[#4168a8] dark:bg-[#4168a8]",
    "bg-[#2d5a96] dark:bg-[#2d5a96]",
    "bg-[#1e3f72] dark:bg-[#9cbbe8]",
    "bg-[#7ca0da] dark:bg-[#7ca0da]",
];

export default async function AboutPage() {
    const supabase = await createServerSupabase();
    const { data: profiles } = await supabase.from("profiles").select("major");

    const majorCounts: Record<string, number> = {};
    let totalValidMajors = 0;

    if (profiles) {
        profiles.forEach((p) => {
            if (p.major && p.major.trim() !== "") {
                const normalized = p.major.trim();
                majorCounts[normalized] = (majorCounts[normalized] || 0) + 1;
                totalValidMajors++;
            }
        });
    }

    const sortedMajors = Object.entries(majorCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    const TOP_N = 7;
    const topMajors = sortedMajors.slice(0, TOP_N);
    const otherMajors = sortedMajors.slice(TOP_N);
    const otherCount = otherMajors.reduce((sum, m) => sum + m.count, 0);

    const chartData = topMajors.map((m, i) => ({
        label: m.label,
        percent: totalValidMajors > 0 ? Number(((m.count / totalValidMajors) * 100).toFixed(1)) : 0,
        colorClass: BRAND_CLASSES[i % BRAND_CLASSES.length],
    }));

    if (otherCount > 0) {
        chartData.push({
            label: "Other",
            percent: totalValidMajors > 0 ? Number(((otherCount / totalValidMajors) * 100).toFixed(1)) : 0,
            colorClass: "bg-[#e9e8e8] dark:bg-muted",
        });
    }

    chartData.sort((a, b) => b.percent - a.percent);
    const maxPercent = Math.max(...chartData.map((d) => d.percent), 1);

    return (
        <main className={`${styles.page} ${inter.variable} ${outfit.variable}`}>
            <header className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroLayout}>
                        <div className={styles.heroHeading}>
                            <p className={styles.eyebrow}>About our chapter</p>
                            <h1 className={styles.title}>This is<br />UCF SASE.</h1>
                        </div>
                        <div className={styles.heroCopy}>
                            <p className={styles.introduction}>
                                We&apos;re the Society of Asian Scientists and Engineers at the University of Central Florida.
                            </p>
                            <p className={styles.heroDescription}>
                                Since 2020, we&apos;ve been building a community rooted in leadership, professionalism, diversity, and service. There&apos;s a place for you here.
                            </p>
                            <Link href="/events" className={styles.heroLink}>
                                Find your next event <ArrowUpRight size={20} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                    <figure className={styles.communityPhoto}>
                        <Image
                            src="/events/gbm1-1.JPG"
                            alt="UCF SASE members posing together in front of their handmade Despicable SASE banner"
                            width={6000}
                            height={4000}
                            sizes="(min-width: 1280px) 1180px, (min-width: 1024px) calc(100vw - 96px), calc(100vw - 40px)"
                            className={styles.photo}
                            priority
                        />
                        <figcaption>
                            <span>A general body meeting, SASE style.</span>
                            <span>Part of a national SASE community of 20,000+ members.</span>
                        </figcaption>
                    </figure>
                </div>
            </header>

            {/* ── Mission Statement ── */}
            <section className={styles.mission} aria-labelledby="about-mission-title">
                <div className={`${styles.container} ${styles.missionLayout}`}>
                    <figure className={styles.workshopPhoto}>
                        <Image
                            src="/events/breadboard1.jpg"
                            alt="SASE members working on laptops during an Arduino and breadboard workshop"
                            width={4032}
                            height={3024}
                            sizes="(min-width: 1280px) 550px, (min-width: 768px) 46vw, calc(100vw - 40px)"
                            className={styles.photo}
                        />
                        <figcaption>Learning by doing, together.</figcaption>
                    </figure>
                    <div className={styles.missionCopy}>
                        <h2 id="about-mission-title" className={styles.sectionTitle}>Different backgrounds.<br />Shared possibilities.</h2>
                        <p className={styles.welcome}>Every background. Every major. You&apos;re welcome here.</p>
                        <div className={styles.missionText}>
                            <p>Our mission is to create a safe, inclusive space where professional development, culture, and community come together.</p>
                            <p>We help each other build skills and pursue our goals. By sharing our experiences and cultural backgrounds, we broaden our perspectives, find new ways to collaborate, and give back through service.</p>
                        </div>
                        <Link href="/programs" className={styles.textLink}>
                            Explore our programs <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Member Demographics ── */}
            <section className="sase-content-section hidden">
                <div className="text-center mb-10">
                    <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">Community</span>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Member Demographics</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Live data from our member registry — by declared major.</p>
                </div>
                <div className="bg-background rounded-2xl border border-border shadow-md p-8 max-w-3xl mx-auto">
                    <div className="space-y-4">
                        {chartData.length === 0 ? (
                            <p className="text-center text-muted-foreground">Not enough data to display demographics yet.</p>
                        ) : (
                            chartData.map((item) => (
                                <div key={item.label} className="flex items-center gap-3 group">
                                    <span className="text-xs text-muted-foreground w-44 shrink-0 text-right font-medium group-hover:text-foreground transition-colors">{item.label}</span>
                                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${item.colorClass}`}
                                            style={{ width: `${(item.percent / maxPercent) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-foreground w-12 shrink-0 tabular-nums">{item.percent}%</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ── Awards Timeline ── */}
            <section className={styles.awards} aria-labelledby="about-awards-title">
                <div className={`${styles.container} ${styles.awardsLayout}`}>
                    <div className={styles.awardsIntroduction}>
                        <h2 id="about-awards-title" className={styles.sectionTitle}>Chapter milestones</h2>
                        <p>
                            National SASE and UCF&apos;s Asian Pacific American Coalition (APAC) have recognized our chapter since 2022.
                        </p>
                    </div>
                    <AwardsTimeline />
                </div>
            </section>

            <section className={styles.invitation} aria-labelledby="about-invitation-title">
                <div className={`${styles.container} ${styles.invitationLayout}`}>
                    <div>
                        <h2 id="about-invitation-title" className={styles.sectionTitle}>Come meet us.</h2>
                        <p>A workshop, a social, a general body meeting. Find an event and say hello.</p>
                    </div>
                    <div className={styles.invitationActions}>
                        <Link href="/events" className={styles.primaryLink}>
                            See upcoming events <ArrowUpRight size={20} aria-hidden="true" />
                        </Link>
                        <Link href="/team" className={styles.textLink}>
                            Meet the team <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
