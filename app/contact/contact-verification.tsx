"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./contact.module.css";

type Turnstile = {
  render: (container: HTMLElement, options: { sitekey: string; action: string; theme: string; size: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; "timeout-callback": () => void; "response-field": boolean }) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

export default function ContactVerification({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 300));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const api = window.turnstile;
    const invalidate = () => { onToken(""); setError(true); };
    let id: string | undefined;
    try {
      id = api.render(container.current, {
        sitekey: siteKey, action: "contact", theme: "light", size: compact ? "compact" : "flexible", "response-field": false,
        callback: token => { setError(false); onToken(token); },
        "expired-callback": invalidate, "error-callback": invalidate, "timeout-callback": invalidate,
      });
    } catch { invalidate(); }
    return () => { if (id) api.remove(id); onToken(""); };
  }, [ready, retry, compact, siteKey, onToken]);

  useEffect(() => {
    if (ready) return;
    const timeout = window.setTimeout(() => setError(true), 15000);
    return () => window.clearTimeout(timeout);
  }, [ready]);

  return (
    <div className={styles.verification}>
      <Script id="contact-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => { setReady(true); setError(false); }} onError={() => setError(true)} />
      <div ref={container} />
      {error ? <p className={styles.fieldError} role="status">Verification couldn’t be completed. {ready ? <button type="button" className={styles.textButton} onClick={() => { setError(false); onToken(""); setRetry(value => value + 1); }}>Retry verification</button> : "Use an email draft instead."}</p> : null}
    </div>
  );
}
