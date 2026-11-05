import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "LumaHacks | UCF SASE",
  description: "A student hackathon by UCF SASE. Build bold ideas, meet your people, and ship something real.",
};

const highlights = [
  {
    number: "01",
    title: "Build without limits",
    description: "Bring an idea, find a team, and turn a weekend of curiosity into something you can show off.",
  },
  {
    number: "02",
    title: "Find your people",
    description: "Connect with makers, mentors, and friends from across UCF who are excited to build alongside you.",
  },
  {
    number: "03",
    title: "Leave with momentum",
    description: "Learn new tools, get feedback from industry leaders, and leave ready for your next big project.",
  },
];

export default function LumaHacksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.orb} aria-hidden="true" />

      <section className={styles.hero} aria-labelledby="lumahacks-title">
        <div className={styles.heroTopline}>
          <span className={styles.brand}>UCF SASE</span>
          <span className={styles.edition}>2026 / 01</span>
        </div>

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>A hackathon for curious minds</p>
          <h1 id="lumahacks-title" className={styles.title}>
            LUMA<span>HACKS</span>
          </h1>
          <p className={styles.tagline}>
            Make the <em>unexpected.</em>
          </p>
          <p className={styles.intro}>
            A weekend of building, learning, and creating the future at the University of Central Florida.
          </p>
          <Link className={styles.cta} href="/signup">
            Register Now <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className={styles.scrollHint} aria-hidden="true">
          <span />
          Scroll to explore
        </div>
      </section>

      <section className={styles.details} aria-labelledby="details-title">
        <div className={styles.sectionHeading}>
          <p className={styles.kicker}>The brief</p>
          <h2 id="details-title">Ideas get <span>louder</span> together.</h2>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoBlock}>
            <p className={styles.label}>When</p>
            <p className={styles.infoValue}>Coming soon</p>
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.label}>Where</p>
            <p className={styles.infoValue}>University of Central Florida</p>
          </div>
          <div className={styles.infoBlock}>
            <p className={styles.label}>Who</p>
            <p className={styles.infoValue}>Students, makers, and dreamers</p>
          </div>
        </div>
      </section>

      <section className={styles.highlights} aria-labelledby="highlights-title">
        <div className={styles.sectionHeading}>
          <p className={styles.kicker}>Why LumaHacks</p>
          <h2 id="highlights-title">Show up. <span>Stand out.</span></h2>
        </div>
        <div className={styles.highlightGrid}>
          {highlights.map((highlight) => (
            <article className={styles.card} key={highlight.number}>
              <span className={styles.cardNumber}>{highlight.number}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-cta-title">
        <p className={styles.kicker}>Your next project starts here</p>
        <h2 id="final-cta-title">Ready to make<br /><span>something luminous?</span></h2>
        <Link className={styles.cta} href="/signup">
          Register Now <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>LumaHacks / UCF SASE</span>
        <span>Built by students, for students.</span>
      </footer>
    </main>
  );
}
