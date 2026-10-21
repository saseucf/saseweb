"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Folder, Search, X } from "lucide-react";
import CsvDownloadButton from "@/components/csv-download-button";
import AdminEventCard from "@/components/events/admin-event-card";
import supabase from "@/lib/auth";
import { organizeAdminEvents, type AdminListEvent } from "@/lib/admin-list-order";

export default function AdminEventsClient({ events: initialEvents, initialNow }: { events: AdminListEvent[]; initialNow: number }) {
  const [events, setEvents] = useState(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(initialNow);
  useEffect(() => { setEvents(initialEvents); }, [initialEvents]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const channel = supabase.channel("realtime_admin_checkins")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_attendances" }, payload => {
        setEvents(previous => previous.map(event => event.id === payload.new.event_id ? { ...event, checkin_count: (event.checkin_count ?? 0) + 1 } : event));
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const { matching, upcoming, folders } = organizeAdminEvents(events, searchQuery, now);
  const searching = searchQuery.trim().length > 0;
  const cards = (items: AdminListEvent[]) => <div className="sase-form-grid !mt-0">{items.map(event => <AdminEventCard key={event.id} event={event} now={now} />)}</div>;

  return <section className="sase-content-section">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="relative w-full max-w-xl">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="search" aria-label="Search all events" placeholder="Search title, type, location, date, host, forms..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-12 text-sm text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-[#89abe3]" />
        {searching && <button type="button" aria-label="Clear event search" onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground"><X size={18} /></button>}
      </div>
      <CsvDownloadButton filename="sase-events" rows={matching} label={searching ? "Download search results (CSV)" : "Download all events (CSV)"} />
    </div>
    <p className="mb-6 text-sm text-muted-foreground">Recently edited first, then earliest start time. Search includes past events in every folder.</p>

    {searching ? <section aria-label="Event search results">
      <h2 className="mb-4 text-xl font-bold" aria-live="polite">{matching.length} {matching.length === 1 ? "match" : "matches"}</h2>
      {matching.length ? cards(matching) : <div className="sase-form-card"><p>No events match your search. Try a type, location, or date.</p></div>}
    </section> : <>
      <section aria-labelledby="upcoming-admin-events">
        <h2 id="upcoming-admin-events" className="mb-4 text-xl font-bold">Upcoming &amp; ongoing <span className="ml-2 text-sm font-medium text-muted-foreground">{upcoming.length}</span></h2>
        {upcoming.length ? cards(upcoming) : <div className="sase-form-card"><p>No upcoming events. Past events are organized below.</p></div>}
      </section>
      {folders.length > 0 && <section className="mt-10" aria-labelledby="past-admin-events">
        <h2 id="past-admin-events" className="text-xl font-bold">Past events</h2>
        <p className="mt-2 text-sm text-muted-foreground">Open a folder to review completed events by type.</p>
        <div className="mt-5 space-y-3">{folders.map(folder => <details key={folder.type} className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-5 py-4 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-90" /><Folder size={20} aria-hidden="true" className="shrink-0 text-[#5579bd]" />
            <span>{folder.type}</span><span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{folder.events.length}</span>
          </summary>
          <div className="border-t border-border p-4 sm:p-5">{cards(folder.events)}</div>
        </details>)}</div>
      </section>}
    </>}
  </section>;
}
