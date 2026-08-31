import { createPublicSupabase } from "@/lib/supabase-public";
import { notFound } from "next/navigation";
import { getEventTypeColor } from "@/lib/event-type-colors";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, Award, User } from "lucide-react";

export const revalidate = 60;

export default async function EventDetailsPage({ params }: { params: { id: string } }) {
    const supabase = createPublicSupabase();

    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .eq("status", "published")
        .single();

    if (error || !event) {
        notFound();
    }

    const eventColor = getEventTypeColor(event.event_type);

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
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight max-w-2xl">
                                {event.title}
                            </h1>
                            <div className="shrink-0 bg-[#F4F6FB] border border-[#89ABE3]/30 text-[#4266A4] px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-black shadow-sm self-start">
                                <Award className="w-5 h-5 text-[#89ABE3]" />
                                <span>{event.points} PT{event.points === 1 ? "" : "S"}</span>
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
                            {event.description ? (
                                <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {event.description}
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
