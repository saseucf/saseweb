import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Inter, Outfit } from "next/font/google";
import styles from "./home.module.css";
import Leaderboard from "@/components/Leaderboard";
import HomeMotion from "./home-motion";
const inter = Inter({ subsets: ["latin"], variable: "--font-home-ui", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-home-body", display: "swap" });

export default function Home() {
  return (
    <main className="sase-home">
      <section className="sase-hero">
        <div className="sase-hero-layout">
          <div className="sase-hero-art" aria-hidden="true">
            <div className="sase-sun" />
            <div className="sase-cloud sase-cloud-top" />
            <div className="sase-cloud sase-cloud-middle" />
          </div>

          <div className="sase-hero-content">
            <div className="sase-hero-brand">
              {/* Dark Mode Logo */}
              <Image 
                src="/logo-hero.png" 
                alt="SASE"
                width={1000}
                height={215}
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 460px, 78vw"
                className="w-full h-auto object-contain drop-shadow-lg hidden dark:block"
                priority
              />
              {/* Light Mode Logo */}
              <Image 
                src="/logo-dark-twotone.png" 
                alt="SASE"
                width={1000}
                height={215}
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 460px, 78vw"
                className="w-full h-auto object-contain drop-shadow-lg block dark:hidden"
                priority
              />
              <p className="sase-hero-subtitle">
                Society of Asian Scientists &amp; Engineers
              </p>
            </div>
            
            <div className="sase-hero-actions">
              <Link href="/checkin" className="bg-[#89abe3] hover:bg-foreground hover:text-background text-foreground font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-3 md:py-4 rounded shadow-lg transition-colors">
                Check-in
              </Link>
              <Link href="/events" className="bg-foreground text-background hover:bg-[#89abe3] hover:text-foreground font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-3 md:py-4 rounded shadow-lg transition-colors">
                See Events
              </Link>
            </div>
          </div>
        </div>
        <div className="sase-hero-waves" aria-hidden="true">
          <span className="sase-hero-wave-back" />
        </div>
      </section>

      <HomeMotion className={`${styles.content} ${inter.variable} ${outfit.variable}`}>
        <section id="about" className={styles.about} aria-labelledby="home-about-title">
          <div className={`${styles.container} ${styles.aboutLayout}`}>
            <div className={styles.aboutCopy} data-home-reveal="0">
              <h1 id="home-about-title" className={styles.aboutTitle}>
                Welcome to the UCF SASE Website
              </h1>
              <div className={styles.prose}>
                <p>
                  Since its founding in 2007, the Society of Asian Scientists and Engineers (SASE) has grown to a nationally recognized organization with 20,000 members worldwide, striving to help Asian heritage scientific and engineering professionals achieve their full potential. The University of Central Florida SASE Chapter was founded in 2020, shortly before the pandemic.
                </p>
                <p>
                  With only 5 years under our belt, we have made tremendous strides towards the development of our members centered around core values of career, diversity, and service. Our events and programs not only advance professional pursuits, but also foster a supportive community that celebrates each and every member’s story.
                </p>
              </div>
            </div>
            <div className={styles.communityPhoto} data-home-reveal="100">
              <Image
                src="/hero.jpg"
                alt="UCF SASE members gathered for a chapter group photo"
                width={6000}
                height={4000}
                loading="eager"
                sizes="(min-width: 1280px) 620px, (min-width: 1024px) 52vw, calc(100vw - 48px)"
                className={styles.photo}
              />
            </div>
          </div>
        </section>

        <section className={styles.values} aria-labelledby="home-values-title">
          <div className={`${styles.container} ${styles.valuesLayout}`}>
            <h2 id="home-values-title" className={styles.sectionTitle} data-home-reveal="0">3 Core Values</h2>
            <ol className={styles.valueList}>
              <li className={styles.value} data-home-reveal="60">
                <span className={styles.valueNumber} aria-hidden="true">01</span>
                <h3>Professional Development</h3>
                <p>We encourage members to leverage the experiences, knowledge, and skills gained through our organization to pursue their goals and aspirations.</p>
              </li>
              <li className={styles.value} data-home-reveal="120">
                <span className={styles.valueNumber} aria-hidden="true">02</span>
                <h3>Service</h3>
                <p>We commit ourselves to promoting service opportunities that enable our members to give back to the community and make a meaningful impact.</p>
              </li>
              <li className={styles.value} data-home-reveal="180">
                <span className={styles.valueNumber} aria-hidden="true">03</span>
                <h3>Diversity</h3>
                <p>We aim to empower our members by showcasing how their diverse backgrounds can broaden perspectives and inspire collaborative efforts.</p>
              </li>
            </ol>
          </div>
        </section>

        <section className={styles.leaderboard} aria-labelledby="home-leaderboard-title">
          <div className={styles.container} data-home-reveal="0">
            <Leaderboard />
          </div>
        </section>

        <section className={styles.sponsors} aria-labelledby="home-sponsors-title">
          <div className={`${styles.container} ${styles.sponsorLayout}`}>
            <div data-home-reveal="0">
              <p className={styles.thanks}>Thank You</p>
              <h2 id="home-sponsors-title" className={styles.sectionTitle}>Our Sponsors</h2>
              <p className={styles.sponsorCopy}>
                UCF SASE is made possible by the generous support of our sponsors. Interested in partnering with us?
                Reach out to our External VP at{" "}
                <a href="mailto:ucfsase.evp@gmail.com">ucfsase.evp@gmail.com</a>.
              </p>
              <Link href="/about" className={styles.aboutLink}>
                Learn More About SASE <ArrowUpRight aria-hidden="true" size={18} />
              </Link>
            </div>
            <a
              href="https://www.blueorigin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Blue Origin, Platinum Sponsor (opens in a new tab)"
              className={styles.sponsorMark}
              data-home-reveal="100"
            >
              <span className={styles.sponsorTier}>Platinum Sponsor</span>
              <Image src="/blueorigin.png" alt="Blue Origin" width={2000} height={1322} sizes="240px" className={styles.sponsorLogo} />
              <ArrowUpRight aria-hidden="true" size={22} className={styles.sponsorArrow} />
            </a>
          </div>
        </section>
      </HomeMotion>
    </main>
  );
}
