"use client";

import Link from "next/link";
import EventActions from "@/components/events/event-actions";
import { isCompletedEvent, lastEditedTime, type AdminListEvent } from "@/lib/admin-list-order";

export default function AdminEventCard({ event, now }: { event: AdminListEvent; now: number }) {
  const completed = isCompletedEvent(event, now);
  const edited = lastEditedTime(event);
  return <article className="sase-form-card flex h-full flex-col justify-between" style={completed ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" } : undefined}>
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-[.65rem] font-bold uppercase tracking-wider ${event.status === "published" ? "bg-blue-50 text-blue-800" : event.status === "draft" ? "bg-gray-100 text-gray-700" : "bg-red-50 text-red-700"}`}>{event.status}</span>
        {completed && <span className="rounded bg-green-100 px-2 py-1 text-[.65rem] font-bold uppercase tracking-wider text-green-800">Date passed</span>}
      </div>
      <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
      <p className="sase-eyebrow mt-2">{event.event_type}</p>
      {edited > 0 && <p className="!mt-2 !text-xs">Edited {new Date(edited).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>}
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="font-semibold">Time</dt><dd className="text-muted-foreground">{new Date(event.start_time).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</dd>
        <dt className="font-semibold">Place</dt><dd className="text-muted-foreground">{event.location?.trim() || "TBD"}</dd>
        <dt className="font-semibold">Check-ins</dt><dd className="text-muted-foreground">{event.checkin_count ?? 0}{Boolean(event.forms?.length) && ` · ${event.rsvp_count ?? 0} RSVPs`}</dd>
        {Boolean(event.forms?.length) && <><dt className="font-semibold">Forms</dt><dd className="flex flex-col gap-1">{event.forms!.map(form => <Link key={form.id} href={`/forms/admin/responses?id=${form.id}`} className="text-blue-700 underline underline-offset-2">{form.title}</Link>)}</dd></>}
      </dl>
    </div>
    <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
      <div className="grid grid-cols-3 gap-3">
        <Link href={`/admin/events/${event.id}/edit`} className="sase-secondary-button flex items-center justify-center !px-2 !py-2.5 text-center !text-xs">Edit</Link>
        <Link href={`/admin/events/${event.id}/rsvps`} className="sase-secondary-button flex items-center justify-center !px-2 !py-2.5 text-center !text-xs">RSVP List</Link>
        <EventActions eventId={event.id} status={event.status} />
      </div>
      <Link href={`/checkin/admin/event/${event.id}/qr`} className="sase-primary-button flex w-full items-center justify-center !py-3 text-center !text-sm">Show QR Code</Link>
      <Link href={`/checkin/admin/event/${event.id}/appearance`} className="text-center text-sm font-bold underline underline-offset-4">Check-in appearance</Link>
    </div>
  </article>;
}
