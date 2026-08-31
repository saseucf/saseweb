"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    forms?: { slug: string, is_open: boolean }[];
};

export default function EventsClient({ events }: { events: Event[] }) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Derived values
    const uniqueTypes = useMemo(() => {
        const types = new Set(events.map(e => e.event_type));
        return Array.from(types).sort();
    }, [events]);

    const sortedEvents = useMemo(() => {
        const now = new Date();
        return [...events].sort((a, b) => {
            const aIsPast = new Date(a.end_time) < now;
            const bIsPast = new Date(b.end_time) < now;
            if (aIsPast && !bIsPast) return 1; // a goes to bottom
            if (!aIsPast && bIsPast) return -1; // b goes to bottom
            return 0; // retain original order (which is by start_time ascending)
        });
    }, [events]);

    const filteredEvents = sortedEvents.filter(e => {
        const matchesType = selectedType ? e.event_type === selectedType : true;
        const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div>
            {/* Search Bar */}
            <div className="relative w-full max-w-md mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search events by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#D0D0CE] rounded-xl leading-5 bg-card placeholder-[#ACA39A] focus:outline-none focus:ring-2 focus:ring-[#e9eef8] focus:border-[#89abe3] transition-all sm:text-sm shadow-sm"
                />
            </div>
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
                        const now = new Date();
                        const eventColor = getEventTypeColor(event.event_type);
                        const isToday = new Date().toDateString() === new Date(event.start_time).toDateString();
                        const isPast = new Date(event.end_time) < now;
                        
                        let cleanDescription = event.description ?? "";
                        let externalUrl = "";
                        const EXT_URL_DELIMITER = "\n\n===EXTERNAL_URL===";
                        if (cleanDescription.includes(EXT_URL_DELIMITER)) {
                            const parts = cleanDescription.split(EXT_URL_DELIMITER);
                            cleanDescription = parts[0];
                            externalUrl = parts[1] ?? "";
                        }

                        const openForm = event.forms?.find(f => f.is_open);
                        
                        return (
                            <Link 
                                key={event.id} 
                                href={`/events/${event.id}`}
                                className={`sase-form-card flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${isPast ? "opacity-75 grayscale-[0.2]" : "hover:ring-2 hover:ring-[#89ABE3] hover:-translate-y-1"}`}
                                style={{ borderLeft: `6px solid ${isPast ? "#ACA39A" : eventColor}` }}
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <h2 className="text-foreground font-bold text-xl flex items-center gap-2">
                                            {event.title}
                                            {isPast && (
                                                <span className="bg-[#ACA39A]/20 text-[#ACA39A] text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-[#ACA39A]/30">
                                                    Finished
                                                </span>
                                            )}
                                        </h2>
                                        <span className="bg-background text-foreground text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                                            {event.points} pt{event.points === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isPast ? "#ACA39A" : eventColor }} />
                                        <p className="sase-eyebrow !m-0 !text-muted-foreground">{event.event_type}</p>
                                    </div>
                                    
                                    {cleanDescription && (
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{cleanDescription}</p>
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
                                    
                                    {((openForm || externalUrl) || (isToday && !isPast)) && !isPast && (
                                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#D0D0CE]">
                                            {(externalUrl || openForm) && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (externalUrl) {
                                                            window.open(externalUrl, "_blank");
                                                        } else {
                                                            router.push(`/forms/${openForm?.slug}`);
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-[#171d52] text-white rounded-lg text-sm font-bold hover:bg-[#2a3473] transition-colors w-full text-center"
                                                >
                                                    RSVP Now
                                                </button>
                                            )}
                                            {isToday && !isPast && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        router.push(`/checkin/scan/${event.id}`);
                                                    }}
                                                    className="px-4 py-2 bg-[#89abe3] text-[#171d52] rounded-lg text-sm font-bold hover:bg-[#a6c1ee] transition-colors w-full text-center"
                                                >
                                                    Check In
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
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
                    <button onClick={prevMonth} className="px-3 py-1 bg-background hover:bg-muted border border-border rounded text-foreground font-bold">&larr;</button>
                    <button onClick={nextMonth} className="px-3 py-1 bg-background hover:bg-muted border border-border rounded text-foreground font-bold">&rarr;</button>
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
                                isSelected ? 'border-[#89abe3] bg-[#F4F6FB] dark:bg-muted shadow-inner' : 'border-border bg-card'
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
                <div className="mt-6 p-4 bg-[#F4F6FB] dark:bg-muted/30 rounded-lg border border-[#89ABE3]">
                    <h4 className="font-bold text-foreground mb-3">
                        Events on {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    {selectedEvents.length === 0 ? (
                        <p className="text-sm text-[#ACA39A]">No events scheduled for this day.</p>
                    ) : (
                        <ul className="space-y-3">
                            {selectedEvents.map(e => (
                                <li key={e.id}>
                                    <Link href={`/events/${e.id}`} className="flex items-start gap-3 bg-card p-3 rounded shadow-sm border border-background hover:border-[#89ABE3] hover:-translate-y-0.5 transition-all duration-200">
                                        <div className="w-1.5 min-h-[40px] self-stretch rounded-full" style={{ backgroundColor: getEventTypeColor(e.event_type) }} />
                                        <div>
                                            <p className="font-bold text-foreground text-sm">{e.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(e.start_time).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} 
                                                {" • "} <span className="font-semibold" style={{ color: getEventTypeColor(e.event_type) }}>{e.event_type}</span>
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
