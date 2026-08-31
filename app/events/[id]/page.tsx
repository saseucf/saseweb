import { createPublicSupabase } from "@/lib/supabase-public";
import { notFound } from "next/navigation";
import { getEventTypeColor } from "@/lib/event-type-colors";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Award, User } from "lucide-react";

export const revalidate = 60;

function generateGoogleCalendarUrl(event: { start_time: string; end_time: string; title: string; description?: string | null; location?: string | null; [key: string]: unknown }) {
    const start = new Date(event.start_time).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(event.end_time).toISOString().replace(/-|:|\.\d+/g, "");
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        dates: `${start}/${end}`,
        details: event.description || "",
        location: event.location || "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateIcsDataUrl(event: { start_time: string; end_time: string; title: string; description?: string | null; location?: string | null; [key: string]: unknown }) {
    const start = new Date(event.start_time).toISOString().replace(/-|:|\.\d+/g, "");
    const end = new Date(event.end_time).toISOString().replace(/-|:|\.\d+/g, "");
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description ? event.description.replace(/\n/g, "\\n") : ""}`,
        `LOCATION:${event.location || ""}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
}

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createPublicSupabase();
    const resolvedParams = await params;

    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", resolvedParams.id)
        .eq("status", "published")
        .single();

    if (error || !event) {
        notFound();
    }

    const eventColor = getEventTypeColor(event.event_type);
    
    let cleanDescription = event.description ?? "";
    let externalUrl = "";
    const EXT_URL_DELIMITER = "\n\n===EXTERNAL_URL===";
    if (cleanDescription.includes(EXT_URL_DELIMITER)) {
        const parts = cleanDescription.split(EXT_URL_DELIMITER);
        cleanDescription = parts[0];
        externalUrl = parts[1] ?? "";
    }
    
    const isPast = new Date(event.end_time) < new Date();

    return (
        <main className="min-h-screen flex flex-col bg-background pt-8 pb-20">
            <div className="max-w-4xl mx-auto w-full px-5 sm:px-8 flex-1">
                <Link href="/events" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Events
                </Link>

                <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                    {/* Header Banner */}
                    <div className="h-32 sm:h-48 w-full relative" style={{ backgroundColor: eventColor }}>
                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 bg-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm" style={{ color: eventColor }}>
                            {event.event_type}
                        </div>
                    </div>

                    <div className="p-6 sm:p-10">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight max-w-2xl flex flex-wrap items-center gap-4">
                                {event.title}
                                {isPast && (
                                    <span className="bg-[#ACA39A]/20 text-[#ACA39A] text-sm uppercase tracking-wider font-bold px-3 py-1 rounded-lg border border-[#ACA39A]/30 self-center">
                                        Finished
                                    </span>
                                )}
                            </h1>
                            <div className="flex flex-col gap-3 shrink-0 self-start">
                                <div className="bg-[#F4F6FB] border border-[#89ABE3]/30 text-[#4266A4] px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-black shadow-sm w-full">
                                    <Award className="w-5 h-5 text-[#89ABE3]" />
                                    <span>{event.points} PT{event.points === 1 ? "" : "S"}</span>
                                </div>
                                {externalUrl && !isPast && (
                                    <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="bg-[#171d52] hover:bg-[#2a3473] text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-sm transition-colors text-center w-full">
                                        RSVP Now
                                    </a>
                                )}
                                {!isPast && (
                                    <div className="flex items-center gap-2 w-full">
                                        <a 
                                            href={generateGoogleCalendarUrl(event)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 text-center py-2 bg-[#f6f8fc] hover:bg-[#e9eef8] text-[#4266A4] rounded-lg text-[0.65rem] sm:text-xs font-bold transition-colors uppercase tracking-wider"
                                        >
                                            + Google Cal
                                        </a>
                                        <a 
                                            href={generateIcsDataUrl(event)} 
                                            download={`${event.title.replace(/\s+/g, '_')}.ics`}
                                            className="flex-1 text-center py-2 bg-[#f6f8fc] hover:bg-[#e9eef8] text-[#4266A4] rounded-lg text-[0.65rem] sm:text-xs font-bold transition-colors uppercase tracking-wider"
                                        >
                                            + Apple/ICS
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-10 border-b border-border">
                            {/* Date & Time */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#f6f8fc] flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Date & Time</h3>
                                    <p className="text-muted-foreground">
                                        {new Date(event.start_time).toLocaleString('en-US', {
                                            timeZone: 'America/New_York',
                                            weekday: 'long', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-muted-foreground font-medium mt-0.5">
                                        {new Date(event.start_time).toLocaleTimeString('en-US', {
                                            timeZone: 'America/New_York',
                                            hour: 'numeric', minute: '2-digit'
                                        })}
                                        {" - "}
                                        {new Date(event.end_time).toLocaleTimeString('en-US', {
                                            timeZone: 'America/New_York',
                                            hour: 'numeric', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#f6f8fc] flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Location</h3>
                                    <p className="text-muted-foreground">{event.location || "TBA"}</p>
                                </div>
                            </div>

                            {/* Host */}
                            {event.host && (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#f6f8fc] flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Host</h3>
                                        <p className="text-muted-foreground">{event.host}</p>
                                    </div>
                                </div>
                            )}

                            {/* Capacity */}
                            {event.capacity && (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#f6f8fc] flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Capacity</h3>
                                        <p className="text-muted-foreground">{event.capacity} spots maximum</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-foreground mb-4">About this Event</h2>
                            {cleanDescription ? (
                                <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {cleanDescription}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No description provided.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
