import CsvDownloadButton from "@/components/csv-download-button";
import { createServerSupabase } from "@/lib/supabase-server";
import OceanAtmosphere from "@/components/ocean-atmosphere";
import { BriefcaseBusiness, HeartHandshake, Globe2 } from "lucide-react";
import AwardsTimeline from "@/components/AwardsTimeline";
import AboutPhotoWheel from "@/components/about-photo-wheel";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Inter, Outfit } from "next/font/google";
import MajorPieChart from "@/components/demographics/major-pie-chart";
import styles from "./about.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-about-ui", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-about-body", display: "swap" });

export const metadata = {
    title: "About – UCF SASE",
    description: "Get to know UCF SASE: our community, our mission, and the milestones we've reached together. All backgrounds and majors are welcome.",
};



export default async function AboutPage() {
    const supabase = await createServerSupabase();
    const { data: profiles } = await supabase.from("profiles").select("major");

    const majorCounts: Record<string, number> = {};

    if (profiles) {
        profiles.forEach((p) => {
            if (p.major && p.major.trim() !== "") {
                const normalized = p.major.trim();
                majorCounts[normalized] = (majorCounts[normalized] || 0) + 1;
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

    const chartData = topMajors.map((m) => ({
        name: m.label,
        value: m.count,
    }));

    if (otherCount > 0) {
        chartData.push({
            name: "Other",
            value: otherCount,
        });
    }

    chartData.sort((a, b) => b.value - a.value);

    return (
        <main className={`${styles.page} ${inter.variable} ${outfit.variable} ocean-page`}>
            <OceanAtmosphere />
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
            <section className="chapter-values" aria-labelledby="about-values-title">
                <div className="chapter-values-heading"><p className="sase-eyebrow">What brings us together</p><h2 id="about-values-title">Three values.<br />One community.</h2><p>A national mission, made personal at UCF. We turn shared values into opportunities to grow, connect, and give back.</p></div>
                <div className="chapter-values-grid">
                    {[
                        { icon: BriefcaseBusiness, number: "01", title: "Professional development", copy: "Build confidence for your next step through technical workshops, career conversations, leadership roles, and a community that shares what it learns.", link: "/programs", action: "Find your next opportunity" },
                        { icon: HeartHandshake, number: "02", title: "Service", copy: "Make a difference beyond campus. Give your time, share your skills, and work alongside fellow members to support our wider community.", link: "/events", action: "Get involved" },
                        { icon: Globe2, number: "03", title: "Diversity", copy: "Bring your whole self. We celebrate Asian heritage and welcome every background and major, making room for new perspectives and lasting friendships.", link: "/team", action: "Meet our community" },
                    ].map(value => <article key={value.number} className="chapter-value"><div className="chapter-value-top"><value.icon size={28} aria-hidden="true" /><span>{value.number}</span></div><h3>{value.title}</h3><p>{value.copy}</p><Link href={value.link}>{value.action} <ArrowUpRight size={17} aria-hidden="true" /></Link></article>)}
                </div>
            </section>

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
            <section className="sase-content-section pt-16 pb-16 bg-card" aria-labelledby="about-demographics-title">
                <div className="text-center mb-10">
                    <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">Community</span>
                    <h2 id="about-demographics-title" className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Member Demographics</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Live data from our member registry — by declared major.</p>
                </div>
                <div className="max-w-3xl mx-auto">
                    <CsvDownloadButton filename="sase-chapter-majors" rows={chartData} label="Download major breakdown (CSV)" />
                    <MajorPieChart data={chartData} />
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

            <AboutPhotoWheel />

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
