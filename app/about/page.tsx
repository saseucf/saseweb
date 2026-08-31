import { createServerSupabase } from "@/lib/supabase-server";
import AwardsTimeline from "@/components/AwardsTimeline";
import { CalendarDays, Globe2 } from "lucide-react";

export const metadata = {
    title: "About – UCF SASE",
    description: "Learn about the Society of Asian Scientists and Engineers at UCF — our story, mission, and impact.",
};

// Brand colors to assign dynamically to the top majors
const BRAND_CLASSES = [
    "bg-[#141b4d] dark:bg-[#89abe3]",
    "bg-[#89abe3] dark:bg-[#a8c3f2]",
    "bg-[#dbc8b6] dark:bg-[#dbc8b6]",
    "bg-[#26355f] dark:bg-[#6888c8]",
    "bg-[#4168a8] dark:bg-[#4168a8]",
    "bg-[#2d5a96] dark:bg-[#2d5a96]",
    "bg-[#1e3f72] dark:bg-[#9cbbe8]",
    "bg-[#7ca0da] dark:bg-[#7ca0da]",
];

export default async function AboutPage() {
    const supabase = await createServerSupabase();
    const { data: profiles } = await supabase.from("profiles").select("major");

    const majorCounts: Record<string, number> = {};
    let totalValidMajors = 0;

    if (profiles) {
        profiles.forEach((p) => {
            if (p.major && p.major.trim() !== "") {
                const normalized = p.major.trim();
                majorCounts[normalized] = (majorCounts[normalized] || 0) + 1;
                totalValidMajors++;
            }
        });
    }

    const sortedMajors = Object.entries(majorCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    const TOP_N = 7;
    const topMajors = sortedMajors.slice(0, TOP_N);
    const otherMajors = sortedMajors.slice(TOP_N);
    const otherCount = otherMajors.reduce((sum, m) => sum + m.count, 0);

    const chartData = topMajors.map((m, i) => ({
        label: m.label,
        percent: totalValidMajors > 0 ? Number(((m.count / totalValidMajors) * 100).toFixed(1)) : 0,
        colorClass: BRAND_CLASSES[i % BRAND_CLASSES.length],
    }));

    if (otherCount > 0) {
        chartData.push({
            label: "Other",
            percent: totalValidMajors > 0 ? Number(((otherCount / totalValidMajors) * 100).toFixed(1)) : 0,
            colorClass: "bg-[#e9e8e8] dark:bg-muted",
        });
    }

    chartData.sort((a, b) => b.percent - a.percent);
    const maxPercent = Math.max(...chartData.map((d) => d.percent), 1);

    return (
        <main className="sase-page">
            {/* ── Hero Banner ── */}
            <div className="relative overflow-hidden py-20 px-6 text-center">
                <div className="relative z-10 max-w-3xl mx-auto">
                    <p className="sase-eyebrow text-[#89abe3]">UCF SASE / About</p>
                    <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mt-2 mb-6">
                        Who We <span className="text-[#89abe3]">Are</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                        Founded in 2020, UCF SASE is a nationally recognized chapter of the Society of Asian Scientists and Engineers — a community built on leadership, professionalism, diversity, and service.
                    </p>
                </div>

                {/* Stats row */}
                <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {[
                        // { icon: <Users className="w-6 h-6" />, value: totalMembers > 0 ? `${totalMembers}+` : "200+", label: "Registered Members" },
                        { icon: <CalendarDays className="w-6 h-6" />, value: "2020", label: "Chapter Founded" },
                        { icon: <Globe2 className="w-6 h-6" />, value: "20K+", label: "National SASE Members" },
                    ].map(({ icon, value, label }) => (
                        <div key={label} className="bg-muted/50 border border-border rounded-2xl p-6 backdrop-blur-sm hover:bg-muted transition-all duration-300 group">
                            <div className="text-[#89abe3] flex justify-center mb-3 group-hover:scale-110 transition-transform">{icon}</div>
                            <div className="text-3xl font-black text-foreground">{value}</div>
                            <div className="text-xs uppercase tracking-widest text-[#89abe3] mt-1">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Mission Statement ── */}
            <section className="sase-content-section">
                <div className="text-center mb-10">
                    <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">Purpose</span>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Mission Statement</h2>
                </div>
                <div className="relative bg-card border border-border rounded-2xl p-8 md:p-12 max-w-4xl mx-auto shadow-[0_16px_48px_rgba(23,29,82,0.1)] overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-1 bg-[#89abe3] rounded-full mb-6 mx-auto" />
                        <p className="text-foreground text-lg md:text-xl leading-relaxed text-center italic">
                            &ldquo;We work to maintain and grow a safe and inclusive space for members that prioritizes pillars of professional development, culture, and community. We encourage members to leverage the experiences, knowledge, and skills gained through our organization to pursue their goals and aspirations. We aim to empower members by showcasing how their diverse cultural backgrounds can broaden perspectives and inspire collaborative efforts.&rdquo;
                        </p>
                        <p className="text-[#89abe3] text-sm font-bold tracking-widest uppercase text-center mt-6">UCF SASE welcomes everyone, regardless of background or major!</p>
                    </div>
                </div>
            </section>

            {/* ── Member Demographics ── */}
            <section className="sase-content-section hidden">
                <div className="text-center mb-10">
                    <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">Community</span>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Member Demographics</h2>
                    <p className="text-muted-foreground mt-2 text-sm">Live data from our member registry — by declared major.</p>
                </div>
                <div className="bg-background rounded-2xl border border-border shadow-md p-8 max-w-3xl mx-auto">
                    <div className="space-y-4">
                        {chartData.length === 0 ? (
                            <p className="text-center text-muted-foreground">Not enough data to display demographics yet.</p>
                        ) : (
                            chartData.map((item) => (
                                <div key={item.label} className="flex items-center gap-3 group">
                                    <span className="text-xs text-muted-foreground w-44 shrink-0 text-right font-medium group-hover:text-foreground transition-colors">{item.label}</span>
                                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${item.colorClass}`}
                                            style={{ width: `${(item.percent / maxPercent) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-foreground w-12 shrink-0 tabular-nums">{item.percent}%</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ── Awards Timeline ── */}
            <section className="sase-content-section pb-16">
                <div className="text-center mb-12">
                    <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">Recognition</span>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Awards &amp; Accomplishments</h2>
                    <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm leading-relaxed">
                        Since 2022, UCF SASE has earned consistent recognition from both National SASE and UCF&apos;s Asian Pacific American Coalition.
                    </p>
                </div>
                <div className="max-w-4xl mx-auto">
                    <AwardsTimeline />
                </div>
            </section>
        </main>
    );
}
