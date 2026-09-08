import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";
import { getContactConfiguration } from "@/lib/contact-server";
import ContactForm from "./contact-form";
import styles from "./contact.module.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-contact-ui" });
export const metadata: Metadata = { title: "Contact & Help | UCF SASE", description: "Contact UCF SASE officers, get help with membership and check-in, or report a website problem." };
export const dynamic = "force-dynamic";

export default function ContactPage() {
  const configuration = getContactConfiguration();
  return (
    <main className={`${styles.page} ${inter.variable}`}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.back} href="/">← Back to SASE</Link>
          <h1>Contact &amp; Help</h1>
          <p>Questions or website trouble? Reach the UCF SASE officer team.</p>
        </header>
        <div className={styles.layout}>
          <section id="contact-form" className={styles.formSection} aria-labelledby="form-heading">
            <h2 id="form-heading">Write to us</h2>
            <ContactForm siteKey={configuration?.siteKey ?? null} />
          </section>
          <aside className={styles.help} aria-label="Contact information and troubleshooting">
            <section aria-labelledby="officer-heading" className={styles.officers}>
              <h2 id="officer-heading">Prefer email?</h2>
              <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </section>
            <section aria-labelledby="help-heading" className={styles.troubleshooting}>
              <h2 id="help-heading">Quick help</h2>
              <details>
                <summary>QR code won’t scan</summary>
                <div>
                  <p>Allow camera access and try “Scan Event QR” with the SASE event code. Still stuck? Ask an officer at the event, or send us the event name.</p>
                </div>
              </details>
              <details>
                <summary>Membership hasn’t updated</summary>
                <div>
                  <p>Try “Verify Payment” on the <Link href="/membership">membership page</Link>. If it’s still pending, send us your payment email and date. Don’t pay again to fix the status.</p>
                </div>
              </details>
              <details>
                <summary>Sign-in or website issues</summary>
                <div>
                  <p>Choose “Website problem” and tell us what happened. Include the page, error text, and device if relevant. No sign-in required.</p>
                  <p>Email screenshots with personal details hidden. Don’t share passwords, verification codes, or sign-in links.</p>
                </div>
              </details>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
