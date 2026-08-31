"use client";

import { useState } from "react";
import Link from "next/link";
import EventActions from "@/components/events/event-actions";

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
    status: "draft" | "published" | "cancelled";
    created_at: string;
    forms?: { id: string, title: string }[];
    checkin_count?: number;
};

export default function AdminEventsClient({ events }: { events: Event[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEvents = events.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <section className="sase-content-section">
            {/* Search Bar */}
            <div className="relative w-full max-w-md mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search events by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-[#D0D0CE] rounded-xl leading-5 bg-card placeholder-[#ACA39A] focus:outline-none focus:ring-2 focus:ring-[#e9eef8] focus:border-[#89abe3] transition-all sm:text-sm shadow-sm"
                />
            </div>

            {filteredEvents.length === 0 ? (
                <div className="sase-form-card">
                    <p className="text-gray-500 font-medium text-center">No events found matching your search.</p>
                </div>
            ) : (
                <div className="sase-form-grid">
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="sase-form-card flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h2 className="text-foreground font-bold text-xl">
                                        {event.title}
                                    </h2>
                                    <span className={`px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded ${
                                        event.status === 'published' ? 'bg-green-100 text-green-700' :
                                        event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {event.status}
                                    </span>
                                </div>
                                
                                <p className="sase-eyebrow mb-3">{event.event_type}</p>

                                <div className="flex flex-col gap-1 mt-4 text-sm">
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-[#344674] min-w-[50px]">Time:</span>
                                        <span className="text-gray-600">
                                            {new Date(event.start_time).toLocaleString('en-US', {
                                                timeZone: 'America/New_York',
                                                weekday: 'short', month: 'short', day: 'numeric',
                                                hour: 'numeric', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-[#344674] min-w-[50px]">Place:</span>
                                        <span className="text-gray-600">
                                            {event.location ?? "Not specified"}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold text-[#344674] min-w-[50px]">Check-ins:</span>
                                        <span className="text-gray-600">
                                            {event.checkin_count}
                                        </span>
                                    </div>
                                    {event.forms && event.forms.length > 0 && (
                                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                                            <span className="font-semibold text-[#344674] min-w-[50px]">Forms:</span>
                                            <span className="text-gray-600 flex flex-col gap-1">
                                                {event.forms.map(f => (
                                                    <Link key={f.id} href={`/forms/admin/responses?id=${f.id}`} className="text-blue-500 hover:underline">
                                                        {f.title}
                                                    </Link>
                                                ))}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <Link
                                        href={`/admin/events/${event.id}/edit`}
                                        className="sase-secondary-button flex items-center justify-center text-center !px-2 !py-2.5 !text-[0.65rem] sm:!text-xs"
                                    >
                                        Edit
                                    </Link>

                                    <Link
                                        href={`/admin/events/${event.id}/rsvps`}
                                        className="sase-secondary-button flex items-center justify-center text-center !px-2 !py-2.5 !text-[0.65rem] sm:!text-xs"
                                    >
                                        RSVP List
                                    </Link>

                                    <EventActions
                                        eventId={event.id}
                                        status={event.status}
                                    />
                                </div>

                                <Link
                                    href={`/checkin/admin/event/${event.id}/qr`}
                                    className="sase-primary-button w-full flex items-center justify-center text-center !py-3 !text-sm"
                                >
                                    Show QR Code
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
