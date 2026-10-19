"use client";

import { useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import styles from "./about-photo-wheel.module.css";

const photos = [
  { src: "/events/gbm1-3.JPG", label: "General body meetings", caption: "A familiar face, a new friend.", alt: "UCF SASE members posing together with a Minion plush at a general body meeting" },
  { src: "/events/menmet-3.png", label: "Mentor–Mentee", caption: "Finding your people.", alt: "SASE members wearing name tags and getting to know each other at a mentor–mentee gathering" },
  { src: "/events/breadboard2.jpg", label: "Hands-on workshops", caption: "A little curiosity goes a long way.", alt: "SASE members collaborating on a circuit project during a breadboard workshop" },
  { src: "/events/gbm2-1.JPG", label: "Chapter moments", caption: "Making room for everyone.", alt: "Members chatting and gathering for a SASE Crossing general body meeting" },
  { src: "/events/lakelily1.jpg", label: "Service together", caption: "Showing up beyond campus.", alt: "SASE members volunteering together beside the lake at Lake Lily" },
  { src: "/events/gbm1-1.JPG", label: "Our community", caption: "Better when we're together.", alt: "SASE members smiling together in front of their handmade Despicable SASE banner" },
];

export default function AboutPhotoWheel() {
  const [paused, setPaused] = useState(false);

  return (
    <section className={styles.section} aria-labelledby="about-photos-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Life at UCF SASE</p>
          <h2 id="about-photos-title">Good people. Shared moments.</h2>
          <p className={styles.intro}>A glimpse of the connections we make along the way.</p>
        </div>
        <button
          type="button"
          className={styles.control}
          aria-pressed={paused}
          aria-controls="about-photo-track"
          onClick={() => setPaused(value => !value)}
        >
          {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          {paused ? "Play photos" : "Pause photos"}
        </button>
      </div>

      <div className={styles.viewport} tabIndex={0} role="region" aria-label="Chapter photo gallery" data-paused={paused}>
        <div id="about-photo-track" className={styles.track}>
          {[false, true].map(duplicate => (
            <ul key={String(duplicate)} className={styles.group} aria-hidden={duplicate ? true : undefined}>
              {photos.map(photo => (
                <li key={photo.src} className={styles.card}>
                  <figure>
                    <div className={styles.imageFrame}>
                      <Image src={photo.src} alt={duplicate ? "" : photo.alt} fill sizes="(min-width: 1440px) 440px, (min-width: 768px) 34vw, 82vw" className={styles.image} />
                    </div>
                    <figcaption>
                      <span>{photo.label}</span>
                      <p>{photo.caption}</p>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
