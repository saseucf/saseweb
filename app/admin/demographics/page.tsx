import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

import { Users, CheckCircle, Trophy, BarChart3, TrendingUp, CalendarDays } from "lucide-react";

export const revalidate = 0; // Don't cache this admin page

export default async function DemographicsPage() {
    const supabase = createServerSupabase();

    // 1. Authenticate and authorize
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role?.trim().toLowerCase() !== "admin") {
        redirect("/");
    }

    // 2. Fetch data
    // Using an inner join-like select. This fetches all attendances and their related event/profile data.
    const { data: attendances, error } = await supabase
        .from("event_attendances")
        .select(`
            id,
            user_id,
            profiles ( first_name, last_name, major, year ),
            events ( event_type )
        `);

    if (error) {
        console.error("Error fetching demographics data:", error);
        return (
            <main className="sase-page pt-[120px]">
                <h1 className="text-2xl font-bold text-red-600">Failed to load demographics data.</h1>
            </main>
        );
    }

    const { count: totalMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    // 3. Process Data
    const totalCheckins = attendances.length;
    
    // Aggregation maps
    const attendeeMap = new Map<string, { name: string; count: number; major: string; year: string }>();
    const eventTypeMap = new Map<string, number>();
    const majorMap = new Map<string, number>();
    const yearMap = new Map<string, number>();

    attendances.forEach(att => {
        const userId = att.user_id;
        const profileInfo = Array.isArray(att.profiles) ? att.profiles[0] : att.profiles;
        const eventInfo = Array.isArray(att.events) ? att.events[0] : att.events;
        
        // Profiles
        if (userId && profileInfo) {
            const name = `${profileInfo.first_name} ${profileInfo.last_name}`;
            const major = profileInfo.major || "Unknown";
            const year = profileInfo.year || "Unknown";

            if (attendeeMap.has(userId)) {
                attendeeMap.get(userId)!.count += 1;
            } else {
                attendeeMap.set(userId, { name, count: 1, major, year });
                // We only count demographic stats (major/year) once per unique user!
                majorMap.set(major, (majorMap.get(major) || 0) + 1);
                yearMap.set(year, (yearMap.get(year) || 0) + 1);
            }
        }

        // Event Types
        if (eventInfo?.event_type) {
            const type = eventInfo.event_type;
            eventTypeMap.set(type, (eventTypeMap.get(type) || 0) + 1);
        }
    });

    const uniqueAttendees = attendeeMap.size;

    // Returning vs New
    let returningAttendees = 0;
    const topAttendees = Array.from(attendeeMap.values()).sort((a, b) => b.count - a.count);
    
    topAttendees.forEach(att => {
        if (att.count > 1) returningAttendees++;
    });

    // Sort Maps for display
    const sortedMajors = Array.from(majorMap.entries()).sort((a, b) => b[1] - a[1]);
    const sortedYears = Array.from(yearMap.entries()).sort((a, b) => b[1] - a[1]);
    const sortedEventTypes = Array.from(eventTypeMap.entries()).sort((a, b) => b[1] - a[1]);


    return (
        <main className="sase-page pt-[120px]">
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                <h1>Demographics & Attendance</h1>
                <p className="mt-2 text-muted-foreground">Monitor attendance trends and member demographics.</p>
            </div>

            <div className="max-w-6xl mx-auto mt-8 flex flex-col gap-8">
                
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <MetricCard 
                        title="Total Members" 
                        value={totalMembers || 0} 
                        icon={<Users className="w-5 h-5 text-[#5579bd]" />} 
                        subtitle="Registered in system"
                    />
                    <MetricCard 
                        title="Total Check-ins" 
                        value={totalCheckins} 
                        icon={<CheckCircle className="w-5 h-5 text-[#5579bd]" />} 
                        subtitle="Across all events"
                    />
                    <MetricCard 
                        title="Unique Members" 
                        value={uniqueAttendees} 
                        icon={<Users className="w-5 h-5 text-[#5579bd]" />} 
                        subtitle="Who attended at least 1 event"
                    />
                    <MetricCard 
                        title="Returning Members" 
                        value={returningAttendees} 
                        icon={<TrendingUp className="w-5 h-5 text-[#5579bd]" />} 
                        subtitle={`${uniqueAttendees > 0 ? Math.round((returningAttendees / uniqueAttendees) * 100) : 0}% of unique attendees`}
                    />
                    <MetricCard 
                        title="Most Popular Type" 
                        value={sortedEventTypes.length > 0 ? sortedEventTypes[0][0] : "N/A"} 
                        icon={<BarChart3 className="w-5 h-5 text-[#5579bd]" />} 
                        subtitle={sortedEventTypes.length > 0 ? `${sortedEventTypes[0][1]} total attendances` : ""}
                    />
                </div>

                {/* Leaderboard and Event Types */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Attendees */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                            <Trophy className="w-6 h-6 text-[#5579bd]" />
                            <h2 className="text-xl font-bold text-foreground">Top Attendees</h2>
                        </div>
                        {topAttendees.length === 0 ? (
                            <p className="text-muted-foreground font-medium text-center py-4">No attendees yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-[#ACA39A]">
                                        <tr>
                                            <th className="pb-3 font-bold uppercase tracking-wider text-[10px]">Rank</th>
                                            <th className="pb-3 font-bold uppercase tracking-wider text-[10px]">Name</th>
                                            <th className="pb-3 font-bold uppercase tracking-wider text-[10px]">Major / Year</th>
                                            <th className="pb-3 font-bold uppercase tracking-wider text-[10px] text-right">Events Attended</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {topAttendees.slice(0, 10).map((att, i) => (
                                            <tr key={i} className="hover:bg-muted/50 transition-colors">
                                                <td className="py-3 font-bold text-[#171d52]">#{i + 1}</td>
                                                <td className="py-3 font-bold text-foreground whitespace-nowrap">{att.name}</td>
                                                <td className="py-3 text-muted-foreground whitespace-nowrap">{att.major} • {att.year}</td>
                                                <td className="py-3 font-black text-[#5579bd] text-right text-base">{att.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Popular Event Types */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                            <CalendarDays className="w-6 h-6 text-[#5579bd]" />
                            <h2 className="text-xl font-bold text-foreground">Event Types</h2>
                        </div>
                        <div className="space-y-4">
                            {sortedEventTypes.length === 0 ? (
                                <p className="text-muted-foreground font-medium text-center py-4">No events yet.</p>
                            ) : (
                                sortedEventTypes.map(([type, count], i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-foreground">{type}</span>
                                            <span className="font-bold text-[#5579bd]">{count}</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div 
                                                className="bg-[#89abe3] h-2 rounded-full" 
                                                style={{ width: `${(count / totalCheckins) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    
                    {/* Majors */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-4">Majors Breakdown</h2>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            {sortedMajors.length === 0 ? (
                                <p className="text-muted-foreground font-medium text-center py-4">No data available.</p>
                            ) : (
                                sortedMajors.map(([major, count], i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/30">
                                        <span className="font-semibold text-foreground text-sm">{major}</span>
                                        <span className="bg-[#e9eef8] text-[#5579bd] px-3 py-1 rounded-full font-bold text-xs">{count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Years */}
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                        <h2 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-4">Years Breakdown</h2>
                        <div className="space-y-4">
                            {sortedYears.length === 0 ? (
                                <p className="text-muted-foreground font-medium text-center py-4">No data available.</p>
                            ) : (
                                sortedYears.map(([year, count], i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/30">
                                        <span className="font-semibold text-foreground text-sm">{year}</span>
                                        <span className="bg-[#e9eef8] text-[#5579bd] px-3 py-1 rounded-full font-bold text-xs">{count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

function MetricCard({ title, value, icon, subtitle }: { title: string; value: string | number; icon: React.ReactNode; subtitle?: string }) {
    return (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">{title}</span>
                <div className="p-2 bg-[#e9eef8] rounded-lg">
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-3xl font-black text-foreground truncate" title={String(value)}>{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-2 font-medium">{subtitle}</p>}
            </div>
        </div>
    );
}
