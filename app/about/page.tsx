"use client";

import { Flower } from "lucide-react";

const majors = [
    { label: "Computer Science",         percent: 26,   fill: "#5579bd" },
    { label: "Other",                     percent: 13.2, fill: "#ffd15d" },
    { label: "Pre-Med / Pre-Health",      percent: 15.7, fill: "#4168a8" },
    { label: "Mechanical Engineering",    percent: 12.4, fill: "#2d5a96" },
    { label: "Aerospace Engineering",     percent: 9.1,  fill: "#264d84" },
    { label: "Biology",                   percent: 7,    fill: "#1e3f72" },
    { label: "Computer Engineering",      percent: 5.4,  fill: "#171d52" },
    { label: "Industrial Engineering",    percent: 3.7,  fill: "#8eafe3" },
    { label: "Materials Engineering",     percent: 2.9,  fill: "#7ca0da" },
    { label: "Civil Engineering",         percent: 2.5,  fill: "#6a90d0" },
    { label: "Electrical Engineering",    percent: 2.1,  fill: "#5880c6" },
];

export default function AboutPage() {
    return (
        <main className="sase-page">
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / About</p>
                <h1>About SASE UCF</h1>
            </div>

            <div className="max-w-4xl mx-auto space-y-6 text-[#64708c] text-lg leading-relaxed">
                <p>
                    Since its founding in 2007, the Society of Asian Scientists and Engineers (SASE) has grown to a
                    nationally recognized organization with 20,000 members worldwide, striving to help Asian heritage
                    scientific and engineering professionals achieve their full potential.
                </p>
                <p>
                    Founded shortly before the pandemic in 2020, the University of Central Florida SASE Chapter have
                    made tremendous strides towards the development of our members centered around core values of
                    leadership, professionalism, diversity, and service. Our events and programs not only advance our
                    professional mission, but fosters a community that celebrates Asian heritage.
                </p>
            </div>

            {/* Mission Statement */}
            <section className="sase-content-section">
                <h2 className="text-[#171d52] font-black text-3xl md:text-4xl mb-6">Mission Statement</h2>
                <div className="bg-white rounded-2xl border border-[#dbe2f0] shadow-[0_12px_30px_rgba(23,29,82,0.06)] p-8 max-w-4xl">
                    <p className="text-[#64708c] text-lg leading-relaxed">
                        We work to maintain and grow a safe and inclusive space for members that prioritizes pillars of
                        professional development, culture, and community. We encourage members to leverage the
                        experiences, knowledge, and skills gained through our organization to pursue their goals and
                        aspirations. We aim to empower members by showcasing how their diverse cultural backgrounds can
                        broaden perspectives and inspire collaborative efforts. We are committed to promoting service
                        opportunities that allow members to give back to the community and make a meaningful impact. UCF
                        SASE welcomes everyone, regardless of background or major!
                    </p>
                </div>
            </section>

            {/* Member Demographics */}
            <section className="sase-content-section">
                <h2 className="text-[#171d52] font-black text-3xl md:text-4xl mb-6">Member Demographics</h2>
                <div className="bg-white rounded-2xl border border-[#dbe2f0] shadow-[0_12px_30px_rgba(23,29,82,0.06)] p-8">
                    <div className="space-y-3">
                        {majors.sort((a, b) => b.percent - a.percent).map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <span className="text-sm text-[#64708c] w-52 shrink-0 text-right">{item.label}</span>
                                <div className="flex-1 bg-[#f0f4fb] rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${(item.percent / 26) * 100}%`, background: item.fill }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-[#171d52] w-12 shrink-0">{item.percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Awards */}
            <section className="sase-content-section">
                <h2 className="text-[#171d52] font-black text-3xl md:text-4xl mb-6">Awards &amp; Accomplishments</h2>
                <p className="text-[#64708c] text-lg mb-6 max-w-3xl">
                    In 2023, UCF SASE received the distinguished honor to host one of National SASE&apos;s annual
                    regional conferences, the SASE Southeast Regional Conference (SERC).
                </p>
                <div className="bg-[#ffd15d] rounded-2xl p-8 max-w-2xl shadow-[0_12px_30px_rgba(23,29,82,0.10)]">
                    <div className="space-y-2 text-[#171d52]">
                        <p className="font-black text-xl text-center mb-3">2024–2025</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />SASE Inspire Awards: Honorable Mention for Most Improved Chapter</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />APAC Hidden Lotus Award: Organization of Distinction</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />APAC Hidden Lotus Award: Most Improved Organization</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />APAC Hidden Lotus Award: Best New Media Initiative</p>

                        <p className="font-black text-xl text-center pt-4 mb-3">2023–2024</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />APAC Hidden Lotus Award: Most Innovative Organization</p>

                        <p className="font-black text-xl text-center pt-4 mb-3">2022–2023</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />APAC Hidden Lotus Award: Most Innovative Organization</p>
                        <p><Flower className="inline-block mr-2 w-5 h-5" />APAC Hidden Lotus Award: Organization of Distinction</p>

                        <p className="text-sm mt-4 pt-4 border-t border-[#e0b84a] text-[#3a2e00]">
                            The Hidden Lotus Awards, presented by APAC (UCF&apos;s Asian Pacific American Coalition),
                            celebrates the work and impact of student organizations that promote cultural awareness,
                            advocacy, and community engagement.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
