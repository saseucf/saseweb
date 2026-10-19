"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function GuestCheckinForm({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkin/guest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, firstName: fields.get("firstName"), lastName: fields.get("lastName"), email: fields.get("email") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Check-in failed. Please try again.");
      setDone(true); setMessage([result.message, result.emailWarning].filter(Boolean).join(" "));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="w-full text-left">
    {done ? <p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">{message}</p> : <form onSubmit={submit} className="space-y-4">
      <h3 className="text-lg font-bold">Check in as a guest</h3>
      <p className="text-sm text-muted-foreground">New here? We’ll create your free SASE account and email you a link to get started.</p>
      <div className="grid grid-cols-2 gap-3">{["firstName", "lastName"].map((name, index) => <label key={name} className="text-sm font-medium">{index ? "Last name" : "First name"}<input name={name} autoComplete={index ? "family-name" : "given-name"} required maxLength={100} className="mt-1 w-full rounded-lg border border-border bg-background p-3" /></label>)}</div>
      <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-1 w-full rounded-lg border border-border bg-background p-3" /></label>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-[#171d52] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Checking in…" : "Check in & join SASE"}</button>
      <p className="text-xs text-muted-foreground">By checking in, you agree to create an account using these details and receive an account welcome email.</p>
    </form>}
    <Link className="mt-5 block text-center text-sm font-bold underline underline-offset-4" href={`/checkin/login?redirect=/checkin/scan/${eventId}`}>Already a member? Sign in</Link>
  </div>;
}
