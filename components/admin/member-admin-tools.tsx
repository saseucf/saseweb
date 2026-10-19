"use client";
import { useState, type FormEvent } from "react";

export default function MemberAdminTools({ onAdded }: { onAdded: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setAdded(false);
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: fields.get("fullName"), email: fields.get("email") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(result.message); setAdded(result.created);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add member."); }
    finally { setBusy(false); }
  }
  async function download() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/members");
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "sase-members.csv"; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(false); }
  }
  return <section className="mb-8 rounded-2xl border border-border bg-card p-6" aria-labelledby="quick-member-title">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 id="quick-member-title" className="text-xl font-bold">Add a member</h2><button onClick={download} disabled={busy} className="sase-secondary-button disabled:opacity-50">Download all member data (CSV)</button></div>
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
      <label className="min-w-48 flex-1 text-sm font-medium">Full name<input name="fullName" autoComplete="name" required maxLength={201} className="mt-1 block w-full rounded-lg border border-border bg-background p-3" /></label>
      <label className="min-w-48 flex-1 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-1 block w-full rounded-lg border border-border bg-background p-3" /></label>
      <button disabled={busy} className="sase-primary-button disabled:opacity-50">{busy ? "Working…" : "Add & send welcome"}</button>
    </form>
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
    {added && <button className="mt-3 text-sm font-bold underline" onClick={onAdded}>Refresh member list</button>}
  </section>;
}
