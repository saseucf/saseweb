"use client";

import { useState, useMemo } from "react";
import { getEventTypeColor } from "@/lib/event-type-colors";

type Event = {
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
};

export default function EventsClient({ events }: { events: Event[] }) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    
    // Derived values
    const uniqueTypes = useMemo(() => {
        const types = new Set(events.map(e => e.event_type));
        return Array.from(types).sort();
    }, [events]);

    const filteredEvents = selectedType 
        ? events.filter(e => e.event_type === selectedType) 
        : events;

    return (
        <div>
            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => setSelectedType(null)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                        selectedType === null 
                        ? 'bg-foreground text-background' 
                        : 'bg-card border border-[#D0D0CE] text-muted-foreground hover:bg-background'
                    }`}
                >
                    All Events
                </button>
                {uniqueTypes.map(type => {
                    const color = getEventTypeColor(type);
                    const isSelected = selectedType === type;
                    return (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                                isSelected 
                                ? 'bg-card shadow-md border-transparent text-foreground' 
                                : 'bg-card border border-[#D0D0CE] text-muted-foreground hover:bg-background'
                            }`}
                            style={{
                                borderColor: isSelected ? color : undefined,
                                borderWidth: isSelected ? '2px' : '1px'
                            }}
                        >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {type}
                        </button>
                    );
                })}
            </div>

            {/* Custom Interactive Calendar */}
            <div className="mb-12 bg-card rounded-2xl border border-[#D0D0CE] shadow-sm p-6 max-w-4xl mx-auto">
                <EventCalendar events={filteredEvents} />
            </div>

            {/* Event List */}
            {filteredEvents.length === 0 ? (
                <div className="sase-form-card">
                    <p className="text-[#ACA39A] font-medium text-center">No upcoming events matching this filter. Check back soon!</p>
                </div>
            ) : (
                <div className="sase-form-grid">
                    {filteredEvents.map((event) => {
                        const eventColor = getEventTypeColor(event.event_type);
                        return (
                            <div 
                                key={event.id} 
                                className="sase-form-card flex flex-col justify-between relative overflow-hidden"
                                style={{ borderLeft: `6px solid ${eventColor}` }}
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h2 className="text-foreground font-bold text-xl">{event.title}</h2>
                                        <span className="bg-background text-foreground text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                            {event.points} pt{event.points === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eventColor }} />
                                        <p className="sase-eyebrow !m-0 !text-muted-foreground">{event.event_type}</p>
                                    </div>
                                    
                                    {event.description && (
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{event.description}</p>
                                    )}

                                    <div className="flex flex-col gap-2 mt-4 border-t border-[#D0D0CE] pt-4">
                                        <div className="flex items-start gap-2 text-sm">
                                            <span className="font-semibold text-foreground min-w-[70px]">When:</span>
                                            <span className="text-muted-foreground">
                                                {new Date(event.start_time).toLocaleString('en-US', {
                                                    timeZone: 'America/New_York',
                                                    weekday: 'short', month: 'short', day: 'numeric',
                                                    hour: 'numeric', minute: '2-digit'
                                                })}
                                                {" - "}
                                                {new Date(event.end_time).toLocaleTimeString('en-US', {
                                                    timeZone: 'America/New_York',
                                                    hour: 'numeric', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <span className="font-semibold text-foreground min-w-[70px]">Where:</span>
                                            <span className="text-muted-foreground">{event.location ?? "TBA"}</span>
                                        </div>
                                        {event.host && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <span className="font-semibold text-foreground min-w-[70px]">Host:</span>
                                                <span className="text-muted-foreground">{event.host}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function EventCalendar({ events }: { events: Event[] }) {
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    // Generate days for grid
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, currentDate.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, currentDate.getMonth(), i));
    }

    // Map events by date string (YYYY-MM-DD)
    const eventsByDate = useMemo(() => {
        const map = new Map<string, Event[]>();
        events.forEach(e => {
            const dateStr = new Date(e.start_time).toISOString().split('T')[0];
            const existing = map.get(dateStr) || [];
            map.set(dateStr, [...existing, e]);
        });
        return map;
    }, [events]);

    // Format safely to account for timezone shifts
    const formatDateKey = (date: Date) => {
        // We use local YYYY-MM-DD string to match the events
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const selectedDateStr = selectedDate ? formatDateKey(selectedDate) : null;
    const selectedEvents = selectedDateStr ? (eventsByDate.get(selectedDateStr) || []) : [];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-foreground">{monthName} {year}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="px-3 py-1 bg-background hover:bg-[#D0D0CE] rounded text-foreground font-bold">&larr;</button>
                    <button onClick={nextMonth} className="px-3 py-1 bg-background hover:bg-[#D0D0CE] rounded text-foreground font-bold">&rarr;</button>
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto no-scrollbar w-full">
                <div className="grid grid-cols-7 gap-1 mb-2 min-w-[450px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-[#ACA39A] uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
                
                {days.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="p-2 h-20 bg-background rounded border border-transparent" />;
                    
                    const dateStr = formatDateKey(date);
                    const dayEvents = eventsByDate.get(dateStr) || [];
                    const isSelected = selectedDateStr === dateStr;
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => setSelectedDate(date)}
                            className={`p-2 min-h-20 rounded border cursor-pointer hover:border-[#89ABE3] transition-colors relative flex flex-col ${
                                isSelected ? 'border-foreground bg-[#F4F6FB] shadow-inner' : 'border-background bg-card'
                            }`}
                        >
                            <span className={`text-sm font-semibold mb-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {date.getDate()}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-auto">
                                {dayEvents.map(e => (
                                    <div 
                                        key={e.id} 
                                        className="w-2 h-2 rounded-full" 
                                        style={{ backgroundColor: getEventTypeColor(e.event_type) }} 
                                        title={e.title}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
                <div className="mt-6 p-4 bg-[#F4F6FB] rounded-lg border border-[#89ABE3]">
                    <h4 className="font-bold text-foreground mb-3">
                        Events on {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    {selectedEvents.length === 0 ? (
                        <p className="text-sm text-[#ACA39A]">No events scheduled for this day.</p>
                    ) : (
                        <ul className="space-y-3">
                            {selectedEvents.map(e => (
                                <li key={e.id} className="flex items-start gap-3 bg-card p-3 rounded shadow-sm border border-background">
                                    <div className="w-1.5 min-h-[40px] self-stretch rounded-full" style={{ backgroundColor: getEventTypeColor(e.event_type) }} />
                                    <div>
                                        <p className="font-bold text-foreground text-sm">{e.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(e.start_time).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} 
                                            {" • "} <span className="font-semibold" style={{ color: getEventTypeColor(e.event_type) }}>{e.event_type}</span>
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
