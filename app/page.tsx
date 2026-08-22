"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="sase-home">
      <div className="sase-sun" aria-hidden="true" />
      <div className="sase-cloud sase-cloud-top" aria-hidden="true" />
      <div className="sase-cloud sase-cloud-middle" aria-hidden="true" />

      <nav className="sase-nav" aria-label="Main navigation">
        <Link href="/" className="sase-mark" aria-label="SASE home">
          <Image
            src="/UCF SASE LOGO 26-27.png"
            alt="UCF SASE"
            width={355}
            height={149}
            priority
          />
        </Link>
        <div className="sase-nav-links">
          <Link className="sase-nav-active" href="/">Home</Link>
          <Link href="/forms">Forms</Link>
          <Link className="sase-login" href="/login">Log in</Link>
        </div>
      </nav>

      <section className="sase-hero">
        <div className="sase-hero-copy">
          <p className="sase-eyebrow">University of Central Florida</p>
          <h1>Build your<br /><span>future together.</span></h1>
          <p className="sase-intro">
            Connect with a community of Asian scientists and engineers through
            events, opportunities, and shared momentum.
          </p>
          <div className="sase-actions">
            <Link href="/forms" className="sase-primary-button">Explore forms</Link>
            <Link href="/forms" className="sase-secondary-button">See forms <span aria-hidden="true">-&gt;</span></Link>
          </div>
        </div>
      </section>

      <div className="sase-wave sase-wave-back" aria-hidden="true" />
      <div className="sase-wave sase-wave-front" aria-hidden="true" />
      <section className="sase-bottom-note">
        <p>01 <span /> A place to grow, lead, and belong.</p>
      </section>
    </main>
  );
}
