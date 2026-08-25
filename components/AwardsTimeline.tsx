"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Star, Award } from "lucide-react";

const awards = [
    {
        year: "2024–2025",
        items: [
            { icon: "star", text: "SASE Inspire Awards: Honorable Mention for Most Improved Chapter" },
            { icon: "trophy", text: "APAC Hidden Lotus Award: Organization of Distinction" },
            { icon: "trophy", text: "APAC Hidden Lotus Award: Most Improved Organization" },
            { icon: "trophy", text: "APAC Hidden Lotus Award: Best New Media Initiative" },
        ],
    },
    {
        year: "2023–2024",
        items: [
            { icon: "trophy", text: "APAC Hidden Lotus Award: Most Innovative Organization" },
        ],
    },
    {
        year: "2022–2023",
        items: [
            { icon: "trophy", text: "APAC Hidden Lotus Award: Most Innovative Organization" },
            { icon: "trophy", text: "APAC Hidden Lotus Award: Organization of Distinction" },
        ],
    },
    {
        year: "2023",
        items: [
            { icon: "award", text: "Selected to host National SASE Southeast Regional Conference (SERC)" },
        ],
    },
];

function TimelineEntry({ entry, index }: { entry: typeof awards[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setActive(true); },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const isLeft = index % 2 === 0;

    return (
        <div
            ref={ref}
            className={`relative flex items-start gap-6 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"} transition-all duration-700 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: `${index * 100}ms` }}
        >
            {/* Content card */}
            <div className={`w-full md:w-[calc(50%-2rem)] ${isLeft ? "md:pr-8 md:text-right" : "md:pl-8 md:text-left"}`}>
                <div
                    className={`bg-white border rounded-2xl p-6 shadow-sm transition-all duration-500 ${active ? "border-[#89abe3] shadow-[0_8px_32px_rgba(137,171,227,0.2)]" : "border-border"}`}
                >
                    <div className={`inline-block text-xs font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-4 transition-colors duration-500 ${active ? "bg-[#89abe3] text-foreground" : "bg-muted text-muted-foreground"}`}>
                        {entry.year}
                    </div>
                    <ul className={`space-y-3 ${isLeft ? "md:text-right" : "md:text-left"}`}>
                        {entry.items.map((item, i) => (
                            <li key={i} className={`flex items-start gap-2 text-[#444f6e] text-sm leading-relaxed ${isLeft ? "md:flex-row-reverse" : ""}`}>
                                {item.icon === "star" ? (
                                    <Star className="w-4 h-4 mt-0.5 text-[#89abe3] shrink-0" />
                                ) : item.icon === "award" ? (
                                    <Award className="w-4 h-4 mt-0.5 text-[#dbc8b6] shrink-0" />
                                ) : (
                                    <Trophy className="w-4 h-4 mt-0.5 text-[#89abe3] shrink-0" />
                                )}
                                <span>{item.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Center dot + line */}
            <div className="hidden md:flex flex-col items-center w-16 shrink-0">
                <div className={`w-5 h-5 rounded-full border-4 transition-all duration-500 z-10 ${active ? "bg-[#89abe3] border-[#89abe3] shadow-[0_0_16px_rgba(137,171,227,0.7)]" : "bg-white border-border"}`} />
            </div>

            {/* Spacer for alt side */}
            <div className="hidden md:block w-[calc(50%-2rem)]" />
        </div>
    );
}

export default function AwardsTimeline() {
    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#89abe3]/50 via-[#dbc8b6]/30 to-transparent" />

            <div className="space-y-10">
                {awards.map((entry, i) => (
                    <TimelineEntry key={entry.year} entry={entry} index={i} />
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-10 max-w-xl mx-auto">
                The Hidden Lotus Awards are presented by APAC (UCF&apos;s Asian Pacific American Coalition) and celebrate student organizations that promote cultural awareness, advocacy, and community engagement.
            </p>
        </div>
    );
}
