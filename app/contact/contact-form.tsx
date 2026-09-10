"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CONTACT_EMAIL, CONTACT_LIMITS, CONTACT_TOPICS, EMPTY_CONTACT, contactDraftHref, validateContact, type ContactErrors, type ContactFields } from "@/lib/contact";
import ContactVerification from "./contact-verification";
import styles from "./contact.module.css";

function Field({ name, label, error, hint, children }: { name: keyof ContactFields; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className={styles.field}>
    <label htmlFor={`contact-${name}`}>{label}</label>
    {hint ? <p className={styles.hint} id={`contact-${name}-hint`}>{hint}</p> : null}
    {children}
    {error ? <p className={styles.fieldError} id={`contact-${name}-error`}>{error}</p> : null}
  </div>;
}

export default function ContactForm({ siteKey }: { siteKey: string | null }) {
  const [fields, setFields] = useState<ContactFields>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const inFlight = useRef(false);
  const company = useRef<HTMLInputElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const submission = useRef<{ fingerprint: string; id: string; createdAt: number } | null>(null);
  const onToken = useCallback((value: string) => setToken(value), []);

  useEffect(() => { if (status || reference) result.current?.focus(); }, [status, reference]);
  useEffect(() => {
    if (!retryAt) return;
    const timeout = window.setTimeout(() => setRetryAt(0), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [retryAt]);

  function update(name: keyof ContactFields, value: string) {
    setFields(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: undefined }));
  }

  function attributes(name: keyof typeof CONTACT_LIMITS, hint = false) {
    return {
      id: `contact-${name}`, name, value: fields[name], maxLength: CONTACT_LIMITS[name],
      onChange: (event: { target: { value: string } }) => update(name, event.target.value),
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": [hint ? `contact-${name}-hint` : "", errors[name] ? `contact-${name}-error` : ""].filter(Boolean).join(" ") || undefined,
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !siteKey || retryAt) return;
    const parsed = validateContact(fields);
    setStatus("");
    if (!parsed.ok) {
      setErrors(parsed.errors);
      const first = Object.keys(parsed.errors)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    if (!token) { setStatus("Complete the verification before sending, or use the email draft below."); return; }
    setErrors({});
    inFlight.current = true;
    setSending(true);
    const fingerprint = JSON.stringify(parsed.data);
    if (!submission.current || submission.current.fingerprint !== fingerprint || Date.now() - submission.current.createdAt > 23 * 60 * 60 * 1000) {
      submission.current = { fingerprint, id: crypto.randomUUID(), createdAt: Date.now() };
    }
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, company: company.current?.value || "", token, submissionId: submission.current.id }),
        signal: AbortSignal.timeout(25000),
      });
      const body = await response.json();
      if (response.ok && body?.ok === true && typeof body.data?.reference === "string") setReference(body.data.reference);
      else {
        if (response.status === 429) setRetryAt(Date.now() + 60000);
        if (body.error?.fields) setErrors(body.error.fields);
        setStatus(body.error?.message || "We could not confirm sending. Your message is still here. Try again or use email.");
      }
    } catch {
      setStatus("We could not confirm sending. Your message is still here. Retry without editing to avoid a duplicate, or use email.");
    } finally {
      inFlight.current = false;
      setSending(false);
      setToken("");
      setVerificationAttempt(value => value + 1);
    }
  }

  if (reference) return <div className={styles.success} ref={result} tabIndex={-1} role="status">
    <h3>Message submitted.</h3>
    <p>Replies go to <strong>{fields.email.trim()}</strong>.</p>
    <p className={styles.small}>Reference: <span className={styles.reference}>{reference}</span></p>
    <button type="button" className={styles.secondary} onClick={() => {
      setReference(""); setStatus(""); setErrors({}); setFields(EMPTY_CONTACT); submission.current = null;
      requestAnimationFrame(() => document.getElementById("contact-name")?.focus());
    }}>Write another message</button>
  </div>;

  return <form className={styles.form} noValidate onSubmit={submit} aria-busy={sending}>
    {!siteKey ? <p className={styles.notice}>Website sending is unavailable. Use an email draft for now.</p> : null}
    <fieldset disabled={sending} className={styles.fields}>
      <legend className={styles.srOnly}>Your contact details and message. Required unless marked optional.</legend>
      <Field name="name" label="Your name" error={errors.name}><input {...attributes("name")} autoComplete="name" required /></Field>
      <Field name="email" label="Reply email" error={errors.email}><input {...attributes("email")} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required /></Field>
      <Field name="topic" label="Topic" error={errors.topic}>
        <select id="contact-topic" name="topic" value={fields.topic} onChange={event => update("topic", event.target.value)} aria-invalid={errors.topic ? true : undefined} aria-describedby={errors.topic ? "contact-topic-error" : undefined}>
          {Object.entries(CONTACT_TOPICS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field name="subject" label="Subject" error={errors.subject}><input {...attributes("subject")} required /></Field>
      <Field name="message" label="Message" error={errors.message} hint={fields.topic === "website" ? "What went wrong, and what did you expect?" : undefined}>
        <textarea {...attributes("message", fields.topic === "website")} rows={5} required />
      </Field>
      {fields.topic === "website" ? <>
        <Field name="page" label="Affected page (optional)" hint="Page path only, without ? or #." error={errors.page}><input {...attributes("page", true)} placeholder="/events" autoCapitalize="none" spellCheck={false} /></Field>
        <Field name="steps" label="Steps to reproduce (optional)" error={errors.steps}><textarea {...attributes("steps")} rows={3} /></Field>
      </> : null}
      <div className={styles.honeypot} aria-hidden="true"><label htmlFor="contact-company">Leave this field empty</label><input id="contact-company" name="company" ref={company} tabIndex={-1} autoComplete="off" /></div>
    </fieldset>
    <p className={styles.small}>Don’t include passwords, verification codes, or payment details.</p>
    {siteKey ? <ContactVerification key={verificationAttempt} siteKey={siteKey} onToken={onToken} /> : null}
    {status ? <div ref={result} tabIndex={-1} role="alert" className={styles.errorNotice}><p>{status}</p></div> : null}
    <div className={styles.actions}>
      {siteKey ? <button className={styles.primary} type="submit" disabled={sending || !!retryAt}>{sending ? "Sending…" : retryAt ? "Wait a minute to retry" : "Send message"}</button> : null}
      <a className={siteKey ? styles.draft : styles.primary} href={sending ? undefined : contactDraftHref(fields)} aria-disabled={sending || undefined} aria-describedby="contact-draft-help">Open email draft{siteKey ? " instead" : ""}</a>
    </div>
    <p className={styles.small} id="contact-draft-help">Review and send the draft in your email app.</p>
    <noscript><p className={styles.notice}>Sending through this form requires JavaScript. You can email {CONTACT_EMAIL} directly.</p></noscript>
  </form>;
}
