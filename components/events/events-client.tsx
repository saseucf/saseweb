"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, MapPin, Search, X } from "lucide-react";
import EventCalendar from "./event-calendar";
import { useEventMotion } from "./use-event-motion";
import { eventDateKey, eventDescription, eventOccursOn, eventStatus, formatCalendarDate, formatEventDate, formatEventRange, googleCalendarUrl, icsDataUrl, type PublicEvent } from "./event-display";
import styles from "@/app/events/events.module.css";

export default function EventsClient({ events, initialNow }: { events: PublicEvent[]; initialNow: string }) {
    const [period, setPeriod] = useState<"upcoming" | "past">("upcoming");
    const [selectedType, setSelectedType] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [now, setNow] = useState(initialNow);
    const root = useRef<HTMLDivElement>(null);
    const calendar = useRef<HTMLDivElement>(null);
    const animateLayout = useEventMotion(root);

    // Match the server's first render, then keep long-lived tabs up to date.
    useEffect(() => {
        const update = () => setNow(new Date().toISOString());
        update();
        const timer = setInterval(update, 60_000);
        return () => clearInterval(timer);
    }, []);

    const uniqueTypes = useMemo(() => [...new Set(events.map(e => e.event_type))].sort(), [events]);
    const matchingEvents = useMemo(() => events.filter(event => {
        const inPeriod = (eventStatus(event, now) === "past") === (period === "past");
        return inPeriod && (!selectedType || event.event_type === selectedType)
            && event.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    }).sort((a, b) => period === "past"
        ? new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        : new Date(a.start_time).getTime() - new Date(b.start_time).getTime()), [events, now, period, searchQuery, selectedType]);
    const filteredEvents = selectedDate ? matchingEvents.filter(event => eventOccursOn(event, selectedDate)) : matchingEvents;
    const groups = new Map<string, PublicEvent[]>();
    filteredEvents.forEach(event => {
        const month = formatEventDate(event.start_time, { month: "long", year: "numeric" });
        groups.set(month, [...(groups.get(month) ?? []), event]);
    });
    const hasFilters = Boolean(selectedType || searchQuery || selectedDate);
    const clearFilters = () => { setSelectedType(""); setSearchQuery(""); setSelectedDate(null); };

    return (
        <div ref={root}>
            <div className={styles.toolbar}>
                <div className={styles.periods} role="group" aria-label="Event timeframe">
                    <button type="button" aria-pressed={period === "upcoming"} onClick={() => { setPeriod("upcoming"); setSelectedDate(null); }}>Upcoming</button>
                    <button type="button" aria-pressed={period === "past"} onClick={() => { setPeriod("past"); setSelectedDate(null); }}>Past events</button>
                </div>
                <button type="button" className={styles.calendarToggle} aria-expanded={calendarOpen} aria-controls="event-calendar" onClick={() => animateLayout(() => { setCalendarOpen(!calendarOpen); setSelectedDate(null); }, calendarOpen ? calendar.current : null)}>
                    <CalendarDays size={18} aria-hidden="true" /><span>{calendarOpen ? "Hide calendar" : "Show calendar"}</span>
                </button>
            </div>
            <div className={styles.filters}>
                <div className={styles.search}>
                    <label className={styles.srOnly} htmlFor="event-search">Search events by name</label>
                    <Search size={18} aria-hidden="true" />
                    <input id="event-search" type="search" placeholder="Search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
                </div>
                <div className={styles.category}>
                    <label className={styles.srOnly} htmlFor="event-type">Event category</label>
                    <select id="event-type" value={selectedType} onChange={event => setSelectedType(event.target.value)}>
                        <option value="">All categories</option>
                        {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <ChevronDown size={18} aria-hidden="true" />
                </div>
            </div>
            <div ref={calendar} id="event-calendar" className={styles.calendarReveal} hidden={!calendarOpen}>
                {calendarOpen ? <EventCalendar events={matchingEvents} today={eventDateKey(now)} selectedDate={selectedDate} onSelect={setSelectedDate} /> : null}
            </div>
            <div className={styles.resultsMeta} data-event-motion="position">
                <p role="status">{filteredEvents.length} {period === "past" ? "past" : "upcoming"} event{filteredEvents.length === 1 ? "" : "s"}{selectedDate ? ` on ${formatCalendarDate(selectedDate, { month: "short", day: "numeric", year: "numeric" })}` : ""}</p>
                {hasFilters && filteredEvents.length > 0 ? <button type="button" onClick={clearFilters}>Clear filters <X size={16} aria-hidden="true" /></button> : null}
            </div>

            {filteredEvents.length === 0 ? (
                <div className={styles.emptyState} data-event-motion="position">
                    <h3>{hasFilters ? "No matching events." : period === "upcoming" ? "More events coming soon." : "No past events yet."}</h3>
                    <p>{hasFilters ? "Try another search, category, or date." : "Explore moments from past events below."}</p>
                    {hasFilters ? <button type="button" className={styles.primaryLink} onClick={clearFilters}>Clear filters</button>
                        : <a href="#event-photos" className={styles.textLink}>Explore event photos <ArrowDown size={18} aria-hidden="true" /></a>}
                </div>
            ) : (
                <div className={styles.eventList}>
                    {[...groups].map(([month, monthEvents]) => (
                        <section key={month} className={styles.monthGroup} aria-label={month}>
                            <h3 className={styles.monthTitle} data-event-motion="position">{month}</h3>
                            {monthEvents.map(event => <EventRow key={event.id} event={event} now={now} animateLayout={animateLayout} />)}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

function EventRow({ event, now, animateLayout }: { event: PublicEvent; now: string; animateLayout: ReturnType<typeof useEventMotion> }) {
    const [expanded, setExpanded] = useState(false);
    const detailsToggle = useRef<HTMLButtonElement>(null);
    const details = useRef<HTMLDivElement>(null);
    const detailsId = `event-details-${event.id}`;
    const status = eventStatus(event, now);
    const isPast = status === "past";
    const isToday = eventDateKey(now) === eventDateKey(event.start_time);
    const { text, externalUrl } = eventDescription(event.description);
    const openForm = event.forms?.find(form => form.is_open);
    const registrationHref = externalUrl || (openForm ? `/forms/${openForm.slug}` : "");
    const toggleDetails = () => animateLayout(() => setExpanded(value => !value), expanded ? details.current : null);
    const closeDetails = () => {
        detailsToggle.current?.focus({ preventScroll: true });
        animateLayout(() => setExpanded(false), details.current);
    };

    return (
        <article className={styles.eventRow} data-event-motion="position" data-expanded={expanded} aria-labelledby={`event-${event.id}`}>
            <div className={styles.eventSurface} data-event-motion="surface" aria-hidden="true" />
            <div className={styles.dateBlock} data-event-motion="position" aria-hidden="true">
                <span>{formatEventDate(event.start_time, { month: "short" })}</span>
                <strong>{formatEventDate(event.start_time, { day: "2-digit" })}</strong>
                <span>{formatEventDate(event.start_time, { weekday: "short" })}</span>
            </div>
            <div className={styles.eventContent} data-event-motion="position">
                <div className={styles.eventTags}>
                    <span>{event.event_type}</span>
                    {status === "ongoing" ? <span className={styles.live}>Happening now</span> : isToday && !isPast ? <span className={styles.live}>Today</span> : null}
                </div>
                <h4 id={`event-${event.id}`}>{event.title}</h4>
                <div className={styles.eventFacts}>
                    <p><Clock3 size={16} aria-hidden="true" /><span>{formatEventRange(event)}</span></p>
                    <p><MapPin size={16} aria-hidden="true" /><span>{event.location || "Location to be announced"}</span></p>
                </div>
            </div>
            <div className={styles.eventActions} data-event-motion="position">
                {!isPast && registrationHref ? (
                    <Link href={registrationHref} target={externalUrl ? "_blank" : undefined} rel={externalUrl ? "noopener noreferrer" : undefined} className={styles.primaryLink} aria-label={`RSVP for ${event.title}${externalUrl ? " (opens in a new tab)" : ""}`}>RSVP <ArrowUpRight size={18} aria-hidden="true" /></Link>
                ) : null}
                <button ref={detailsToggle} type="button" className={`${styles.detailLink} ${styles.detailsToggle}`} aria-expanded={expanded} aria-controls={detailsId} aria-label={`${expanded ? "Hide" : "View"} details for ${event.title}`} onClick={toggleDetails}>
                    {expanded ? "Hide details" : "View details"}<ChevronDown size={18} aria-hidden="true" />
                </button>
            </div>
            <div ref={details} id={detailsId} className={styles.inlineDetails} hidden={!expanded}>
                {expanded ? (
                    <>
                        <div className={styles.detailsLayout}>
                            <div className={styles.fullDescription}>
                                <p>{text || "No additional description has been posted."}</p>
                            </div>
                            <dl className={styles.detailsFacts}>
                                {event.host ? <div><dt>Hosted by</dt><dd>{event.host}</dd></div> : null}
                                {event.capacity !== null ? <div><dt>Capacity</dt><dd>{event.capacity} people</dd></div> : null}
                                <div><dt>Member points</dt><dd>{event.points} {event.points === 1 ? "point" : "points"}</dd></div>
                            </dl>
                        </div>
                        <div className={styles.detailsFooter}>
                            <div className={styles.detailsUtilities}>
                                {!isPast ? <>
                                    {isToday ? <Link href={`/checkin/scan/${event.id}`} className={styles.detailLink}>Check in <Check size={18} aria-hidden="true" /></Link> : null}
                                    <details className={styles.calendarExport}>
                                        <summary>Add to calendar <ChevronDown size={16} aria-hidden="true" /></summary>
                                        <div>
                                            <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Google Calendar <ArrowUpRight size={16} aria-hidden="true" /></a>
                                            <a href={icsDataUrl(event)} download={`${event.title.replace(/\s+/g, "_")}.ics`}>Apple / Outlook (.ics)</a>
                                        </div>
                                    </details>
                                </> : <p>This event has ended.</p>}
                            </div>
                            <button type="button" className={styles.closeDetails} onClick={closeDetails}>Close details <X size={16} aria-hidden="true" /></button>
                        </div>
                    </>
                ) : null}
            </div>
        </article>
    );
}
