import Link from "next/link";
import styles from "./page.module.css";

export default function LumaHacksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.glow} />
        <span className={`${styles.bubble} ${styles.bubbleOne}`} />
        <span className={`${styles.bubble} ${styles.bubbleTwo}`} />
        <span className={`${styles.bubble} ${styles.bubbleThree}`} />
      </div>
      <section className={styles.hero} aria-labelledby="lumahacks-title">
        <p className={styles.eyebrow}>UCF SASE presents</p>
        <h1 id="lumahacks-title" className={styles.title}>LUMA<span>HACKS</span></h1>
        <p className={styles.tagline}>Build something that glows.</p>
        <p className={styles.location}>A new hackathon is rising from the deep.</p>
        <Link className={styles.cta} href="/forms/lumahacks">Sign up</Link>
      </section>
    </main>
  );
}
