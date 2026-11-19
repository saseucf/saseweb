"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveHackathon } from "@/app/actions/hackathons";

type Hackathon = { id: string; name: string; slug: string; discord_channel_id: string | null; discord_role_id: string | null };
const empty = { name: "", slug: "", discord_channel_id: "", discord_role_id: "" };

export default function HackathonManager({ hackathons }: { hackathons: Hackathon[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string>();
  const [fields, setFields] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function reset() { setEditing(undefined); setFields(empty); setError(""); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const result = await saveHackathon(fields, editing);
      if (result.error) setError(result.error);
      else { reset(); setMessage("Hackathon saved. You can now select it when creating or editing an event."); router.refresh(); }
    } catch { setError("Could not save. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-8 lg:grid-cols-2">
    <section className="sase-creator-panel p-6">
      <h2 className="text-xl font-semibold mb-4">{editing ? "Edit hackathon" : "Create hackathon"}</h2>
      <form onSubmit={submit} className="space-y-4">
        {([
          ["name", "Hackathon name", "LumaHacks 2028"],
          ["slug", "Unique slug", "lumahacks-2028"],
          ["discord_channel_id", "Discord announcement channel ID", "Paste channel ID"],
          ["discord_role_id", "Discord reminder role ID", "Paste role ID"],
        ] as const).map(([key, label, placeholder]) => <div key={key}>
          <label htmlFor={`hackathon-${key}`} className="block text-sm font-medium mb-1">{label}</label>
          <input id={`hackathon-${key}`} value={fields[key]} placeholder={placeholder}
            required={key === "name" || key === "slug"} disabled={busy}
            maxLength={key === "name" ? 120 : key === "slug" ? 100 : 20}
            inputMode={key.startsWith("discord") ? "numeric" : "text"}
            onChange={e => setFields({ ...fields, [key]: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2" />
        </div>)}
        <p className="text-sm text-muted-foreground">In Discord, enable Developer Mode, then copy the channel and role IDs. Both IDs are required for reminders; leave them blank to configure later. The bot must be able to send messages and mention the role.</p>
        {editing && <p className="text-sm text-muted-foreground">Changes apply to reminders that have not been attempted. Previously sent reminders will not be sent again.</p>}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button disabled={busy} className="sase-primary-button">{busy ? "Saving…" : editing ? "Save changes" : "Create hackathon"}</button>
          {editing && <button type="button" disabled={busy} onClick={reset} className="sase-secondary-button">Cancel</button>}
        </div>
      </form>
      {message && <p role="status" className="mt-4">{message}</p>}
    </section>
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Existing hackathons</h2>
      {!hackathons.length && <p>No hackathons yet. Create your first one here.</p>}
      {hackathons.map(h => <article key={h.id} className="rounded-xl border border-border p-5 space-y-2">
        <h3 className="font-semibold">{h.name}</h3>
        <p className="text-sm text-muted-foreground">{h.slug}</p>
        <p className="text-sm">{h.discord_channel_id && h.discord_role_id ? "Discord destination configured" : "Reminders paused: channel or role missing"}</p>
        <p className="text-sm break-all">Channel: {h.discord_channel_id ?? "Not set"}<br />Role: {h.discord_role_id ?? "Not set"}</p>
        <button disabled={busy} className="sase-secondary-button" aria-label={`Edit ${h.name}`} onClick={() => {
          setEditing(h.id); setFields({ name: h.name, slug: h.slug, discord_channel_id: h.discord_channel_id ?? "", discord_role_id: h.discord_role_id ?? "" }); setMessage(""); setError("");
        }}>Edit</button>
      </article>)}
    </section>
  </div>;
}
