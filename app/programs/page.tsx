import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import styles from "./programs.module.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-programs-ui", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-programs-body", display: "swap" });

export const metadata: Metadata = {
    title: "Programs | UCF SASE",
    description: "Find your place in UCF SASE through the Intern and Mentor–Mentee programs. Explore the experience, time commitments, and how to get involved.",
};

export default function ProgramsPage() {
    return (
        <main className={`${styles.page} ${inter.variable} ${outfit.variable}`}>
            <header className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroLayout}>
                        <div className={styles.heroCopy}>
                            <p className={styles.eyebrow}>UCF SASE / Programs</p>
                            <h1 className={styles.title}>More than<br />a meeting.</h1>
                            <p className={styles.heroDescription}>
                                Get behind the scenes. Find someone in your corner.
                                Our programs give you more ways to learn, lead, and belong at SASE.
                            </p>
                        </div>
                        <figure className={styles.heroPhoto}>
                            <Image
                                src="/events/gbm1-3.JPG"
                                alt="SASE members smiling together with a Minion plush at a general body meeting"
                                width={6000}
                                height={4000}
                                sizes="(min-width: 1280px) 570px, (min-width: 768px) 46vw, calc(100vw - 40px)"
                                priority
                            />
                            <figcaption>A few familiar faces from a SASE GBM.</figcaption>
                        </figure>
                    </div>
                    <nav className={styles.programNav} aria-label="Explore our programs">
                        <a href="#intern-program" className={styles.programLink}>
                            <span>
                                <strong>Intern Program</strong>
                                <span>Build leadership experience · About 2–4 hrs/week</span>
                            </span>
                            <ArrowDown size={22} aria-hidden="true" />
                        </a>
                        <a href="#mentor-mentee" className={styles.programLink}>
                            <span>
                                <strong>Mentor–Mentee</strong>
                                <span>Grow with a peer · Meet at least twice a month</span>
                            </span>
                            <ArrowDown size={22} aria-hidden="true" />
                        </a>
                    </nav>
                </div>
            </header>

            <section id="intern-program" className={styles.internSection} aria-labelledby="intern-title" tabIndex={-1}>
                <div className={styles.container}>
                    <div className={styles.internLayout}>
                        <div className={styles.programIntro}>
                            <h2 id="intern-title" className={styles.sectionTitle}>Intern Program</h2>
                            <p className={styles.lead}>Help shape what happens at SASE.</p>
                            <p className={styles.bodyCopy}>
                                Work alongside the executive board to plan events, run workshops,
                                and support the chapter. This semester-long experience is open to
                                new and returning members, with flexible roles that fit your interests and availability.
                            </p>
                            <dl className={styles.commitment}>
                                <div><dt>Time commitment</dt><dd>About 2–4 hours a week</dd></div>
                                <div><dt>Duration</dt><dd>One semester</dd></div>
                            </dl>
                            <p className={styles.takeaway}>
                                Leave with leadership and project-management skills,
                                officer shadowing experience, and a capstone for your portfolio.
                            </p>
                        </div>
                        <div className={styles.semester}>
                            <h3 className={styles.detailTitle}>Your semester as an intern</h3>
                            <ol className={styles.timeline} role="list">
                                <li>
                                    <span className={styles.phase}>Early semester</span>
                                    <h4>Learn the ropes.</h4>
                                    <p>Start with kickoff and training, then shadow officers to see how the chapter runs.</p>
                                </li>
                                <li>
                                    <span className={styles.phase}>Throughout the semester</span>
                                    <h4>Be part of the work.</h4>
                                    <p>Attend weekly intern meetings and GBMs. Contribute to at least one committee and help bring events and workshops to life.</p>
                                </li>
                                <li>
                                    <span className={styles.phase}>End of semester</span>
                                    <h4>Make something yours.</h4>
                                    <p>Complete your capstone project and share what you&apos;ve built at the capstone showcase.</p>
                                </li>
                            </ol>
                        </div>
                    </div>
                    <div className={styles.applicationRow}>
                        <p>Intern applications <span>Coming soon</span></p>
                        <Link href="/events" className={styles.textLink}>
                            Find info sessions &amp; GBMs <ArrowUpRight size={19} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            <section id="mentor-mentee" className={styles.mentorSection} aria-labelledby="mentor-title" tabIndex={-1}>
                <div className={styles.container}>
                    <div className={styles.mentorHeading}>
                        <h2 id="mentor-title" className={styles.sectionTitle}>Mentor–Mentee<br /> Program</h2>
                        <div>
                            <p className={styles.lead}>A familiar face. A little perspective.</p>
                            <p className={styles.bodyCopy}>
                                Share your experience as a mentor or find guidance as a mentee.
                                Connect with a peer for academic support, career advice, and someone
                                to help you stay on track.
                            </p>
                        </div>
                    </div>
                    <div className={styles.mentorLayout}>
                        <figure className={styles.mentorPhoto}>
                            <Image
                                src="/events/menmet-3.png"
                                alt="SASE members wearing name tags and getting to know each other at a Mentor–Mentee gathering"
                                width={4032}
                                height={3024}
                                loading="eager"
                                sizes="(min-width: 1280px) 570px, (min-width: 768px) 46vw, calc(100vw - 40px)"
                            />
                            <figcaption>
                                Getting to know each other, one conversation at a time.
                                <p className={styles.photoNote}>
                                    Build confidence, stronger study habits, and friendships that last beyond the semester.
                                </p>
                            </figcaption>
                        </figure>
                        <div className={styles.mentorDetails}>
                            <div>
                                <h3 className={styles.detailTitle}>Start with a conversation</h3>
                                <p>Meet potential matches at Speed Friending. Pairings consider your major, year, interests, and goals.</p>
                            </div>
                            <div>
                                <h3 className={styles.detailTitle}>Make time for each other</h3>
                                <p>Meet at least twice a month, in person or virtually. Set 1–2 SMART goals and track your progress together.</p>
                            </div>
                            <div>
                                <h3 className={styles.detailTitle}>Stay connected</h3>
                                <p>Attend at least two Mentor–Mentee events each semester. Optional mini-cohorts and themed socials offer more ways to get to know the community.</p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.applicationRow}>
                        <p>Mentor &amp; mentee applications <span>Coming soon</span></p>
                        <Link href="/events" className={styles.textLink}>
                            Explore SASE events <ArrowUpRight size={19} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className={styles.invitation} aria-labelledby="program-questions">
                <div className={`${styles.container} ${styles.invitationLayout}`}>
                    <div>
                        <h2 id="program-questions">Not sure where to start?</h2>
                        <p>Get to know the officers behind the programs and ask about finding your fit.</p>
                    </div>
                    <Link href="/team" className={styles.teamLink}>
                        Meet the team <ArrowRight size={20} aria-hidden="true" />
                    </Link>
                </div>
            </section>
        </main>
    );
}
