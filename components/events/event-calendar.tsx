"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { eventOccursOn, type PublicEvent } from "./event-display";
import styles from "@/app/events/events.module.css";

export default function EventCalendar({ events, today, selectedDate, onSelect }: {
    events: PublicEvent[]; today: string; selectedDate: string | null; onSelect: (date: string | null) => void;
}) {
    // UTC is only used for date-only calendar arithmetic, never event grouping.
    const [month, setMonth] = useState(() => `${today.slice(0, 7)}-01`);
    const monthDate = new Date(`${month}T12:00:00Z`);
    const year = monthDate.getUTCFullYear();
    const monthIndex = monthDate.getUTCMonth();
    const monthLabel = monthDate.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
    const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const leadingDays = monthDate.getUTCDay();
    const moveMonth = (offset: number) => {
        setMonth(new Date(Date.UTC(year, monthIndex + offset, 1)).toISOString().slice(0, 10));
        onSelect(null);
    };
    const isCurrentMonth = month.slice(0, 7) === today.slice(0, 7);

    return (
        <div className={styles.calendarPanel}>
            <div className={styles.calendarBody}>
                <div className={styles.calendarHeader}>
                    <h3 aria-live="polite">{monthLabel}</h3>
                    <div><button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={20} aria-hidden="true" /></button><button type="button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={20} aria-hidden="true" /></button></div>
                </div>
                <div className={styles.calendarGrid} role="group" aria-label={monthLabel}>
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => <abbr key={day} title={day}>{day.slice(0, 1)}</abbr>)}
                    {Array.from({ length: leadingDays }, (_, i) => <span key={`empty-${i}`} aria-hidden="true" />)}
                    {Array.from({ length: dayCount }, (_, i) => {
                        const date = `${month.slice(0, 7)}-${String(i + 1).padStart(2, "0")}`;
                        const count = events.filter(event => eventOccursOn(event, date)).length;
                        const label = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric" });
                        return <button type="button" key={date} aria-label={`${label}, ${count} event${count === 1 ? "" : "s"}`} aria-pressed={date === selectedDate} aria-current={date === today ? "date" : undefined} onClick={() => onSelect(date === selectedDate ? null : date)}>
                            <span>{i + 1}</span>{count > 0 ? <span className={styles.eventDot} aria-hidden="true" /> : null}
                        </button>;
                    })}
                </div>
            </div>
            <div className={styles.calendarHelp}>
                <span>Select a date. Dots mark events.</span>
                {!isCurrentMonth || selectedDate ? <button type="button" onClick={() => { setMonth(`${today.slice(0, 7)}-01`); onSelect(null); }}>{isCurrentMonth ? "Show all dates" : "Back to this month"}</button> : null}
            </div>
        </div>
    );
}
