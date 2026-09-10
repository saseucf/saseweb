// Presentation helpers for the public Events index. Calendar days and event
// labels share the chapter timezone regardless of the visitor's device timezone.
export const EVENT_TIME_ZONE = "America/New_York";
const dateKeyFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export type PublicEvent = {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    location: string | null;
    start_time: string;
    end_time: string;
    capacity: number | null;
    points: number;
    host: string | null;
    created_at: string;
    status: "draft" | "published" | "cancelled";
    forms?: { slug: string; is_open: boolean }[];
};

export function eventDateKey(value: string | Date): string {
    const parts = dateKeyFormatter.formatToParts(new Date(value));
    const part = (name: string) => parts.find(p => p.type === name)?.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatEventDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
    return new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, ...options }).format(new Date(value));
}

export function formatCalendarDate(dateKey: string, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${dateKey}T12:00:00Z`));
}

export function formatEventRange(event: Pick<PublicEvent, "start_time" | "end_time">) {
    const sameDay = eventDateKey(event.start_time) === eventDateKey(event.end_time);
    const start = formatEventDate(event.start_time, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    const end = formatEventDate(event.end_time, sameDay
        ? { hour: "numeric", minute: "2-digit" }
        : { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    return `${start} – ${end}`;
}

export function eventStatus(event: Pick<PublicEvent, "start_time" | "end_time">, now: string) {
    if (new Date(event.end_time).getTime() <= new Date(now).getTime()) return "past";
    if (new Date(event.start_time).getTime() <= new Date(now).getTime()) return "ongoing";
    return "upcoming";
}

export function eventOccursOn(event: Pick<PublicEvent, "start_time" | "end_time">, date: string) {
    // Treat midnight end times as the end of the previous day, not a new day.
    const finalInstant = new Date(Math.max(new Date(event.start_time).getTime(), new Date(event.end_time).getTime() - 1));
    return eventDateKey(event.start_time) <= date && eventDateKey(finalInstant) >= date;
}

export function eventDescription(description: string | null) {
    const [text, candidate] = (description ?? "").split("\n\n===EXTERNAL_URL===");
    let externalUrl = "";
    if (candidate) {
        try {
            const url = new URL(candidate.trim());
            if (url.protocol === "https:" || url.protocol === "http:") externalUrl = url.href;
        } catch { /* Keep the event readable when an old registration URL is invalid. */ }
    }
    return { text, externalUrl };
}

function calendarTimestamp(value: string) {
    return new Date(value).toISOString().replace(/-|:|\.\d+/g, "");
}

export function googleCalendarUrl(event: PublicEvent) {
    const { text } = eventDescription(event.description);
    return `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: "TEMPLATE", text: event.title,
        dates: `${calendarTimestamp(event.start_time)}/${calendarTimestamp(event.end_time)}`,
        details: text, location: event.location ?? "",
    })}`;
}

export function icsDataUrl(event: PublicEvent) {
    const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//UCF SASE//Events//EN", "BEGIN:VEVENT",
        `UID:${event.id}@saseucf`, `DTSTAMP:${calendarTimestamp(event.created_at)}`,
        `DTSTART:${calendarTimestamp(event.start_time)}`, `DTEND:${calendarTimestamp(event.end_time)}`,
        `SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(eventDescription(event.description).text)}`,
        `LOCATION:${escape(event.location ?? "")}`, "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
