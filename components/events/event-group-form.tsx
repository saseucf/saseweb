"use client";

import { useState, type FormEvent } from "react";
import { saveEventGroup } from "@/app/actions/event-groups";

type EventGroup = {
    id: string;
    name: string;
    discord_channel_id: string;
    discord_role_id: string;
};

export default function EventGroupForm({ name, group }: { name: string; group?: EventGroup }) {
    const [result, setResult] = useState({ ok: false, message: "" });
    const [pending, setPending] = useState(false);
    const inputClass = "rounded-lg border border-border bg-card px-3 py-2";

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        setPending(true);
        setResult({ ok: false, message: "" });
        try {
            const next = await saveEventGroup(name, new FormData(form));
            setResult(next);
        } catch {
            setResult({ ok: false, message: "Could not save this event group. Refresh the page and try again." });
        } finally {
            setPending(false);
        }
    }

    return (
        <form onSubmit={submit} className="sase-form-card grid gap-4">
            <h2 className="text-xl font-bold">{name}</h2>
            <label className="grid gap-1 text-sm font-semibold">
                Discord channel ID for #{name.toLowerCase()}-announcements
                <input className={inputClass} name="discord_channel_id" defaultValue={group?.discord_channel_id} inputMode="numeric" pattern="[1-9][0-9]{16,19}" required />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
                Discord role ID
                <input className={inputClass} name="discord_role_id" defaultValue={group?.discord_role_id} inputMode="numeric" pattern="[1-9][0-9]{16,19}" required />
            </label>
            <button className="sase-primary-button justify-self-start" type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save channel and role"}
            </button>
            {result.message && (
                <p role={result.ok ? "status" : "alert"} className={result.ok ? "text-sm text-muted-foreground" : "text-sm text-red-600"}>
                    {result.message}
                </p>
            )}
        </form>
    );
}
