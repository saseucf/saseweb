"use client";

import Link from "next/link";
import {
    Rocket,
    Users,
    CalendarCheck,
    ClipboardList,
    HeartHandshake,
    Star,
} from "lucide-react";

export default function ProgramsPage() {
    return (
        <main className="sase-page">
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Programs</p>
                <h1>Programs</h1>
                <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                    UCF SASE offers hands-on programs designed to grow leadership, professionalism, and community.
                    Explore our Intern Program and Mentor–Mentee Program to get involved, build skills, and connect
                    with peers and professionals.
                </p>
            </div>

            {/* Intern Program */}
            <section className="sase-content-section">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#e9eef8] text-[#89abe3] p-3 rounded-full">
                        <Rocket className="w-6 h-6" />
                    </div>
                    <h2 className="text-foreground font-black">Intern Program</h2>
                </div>
                <p className="text-muted-foreground text-lg mb-6 max-w-3xl">
                    The SASE Intern Program is a semester-long experience for new and returning members to gain
                    leadership exposure by shadowing officers, contributing to committees, and delivering a capstone
                    project. Interns work closely with the executive board to plan events, run workshops, and support
                    chapter operations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ProgramCard icon={<Star className="w-5 h-5" />} title="What You Gain">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Hands-on officer shadowing experience.</li>
                            <li>Leadership and project-management skills.</li>
                            <li>A portfolio-worthy capstone project.</li>
                        </ul>
                    </ProgramCard>
                    <ProgramCard icon={<ClipboardList className="w-5 h-5" />} title="Expectations">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Attend weekly intern meetings and GBMs.</li>
                            <li>Contribute to at least one committee.</li>
                            <li>Complete capstone project by end of semester.</li>
                        </ul>
                    </ProgramCard>
                    <ProgramCard icon={<CalendarCheck className="w-5 h-5" />} title="Timeline &amp; Commitment">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Time: ~2–4 hours/week during the semester.</li>
                            <li>Kickoff and training early semester; capstone showcase near the end.</li>
                            <li>Flexible roles to match availability and interests.</li>
                        </ul>
                    </ProgramCard>
                </div>

                <div className="flex flex-wrap gap-3 mt-8">
                    <button disabled className="sase-primary-button opacity-50 cursor-not-allowed">Intern Apps (Coming Soon)</button>
                    <Link href="/events" className="sase-secondary-button">Find Info Sessions &amp; GBMs</Link>
                </div>
            </section>

            {/* Mentor–Mentee Program */}
            <section className="sase-content-section">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#e9eef8] text-[#89abe3] p-3 rounded-full">
                        <Users className="w-6 h-6" />
                    </div>
                    <h2 className="text-foreground font-black">Mentor–Mentee Program</h2>
                </div>
                <p className="text-muted-foreground text-lg mb-6 max-w-3xl">
                    Our Mentor–Mentee Program pairs members for peer guidance, academic support, and career growth.
                    Whether you want to share experience as a mentor or get tailored advice as a mentee, you&apos;ll
                    join a network that empowers you to set goals and stay accountable.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ProgramCard icon={<Users className="w-5 h-5" />} title="How It Works">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Kickoff with Speed Friending to meet potential matches.</li>
                            <li>Pairs matched by major, year, interests, and goals.</li>
                            <li>Optional mini-cohorts and themed socials throughout the term.</li>
                        </ul>
                    </ProgramCard>
                    <ProgramCard icon={<ClipboardList className="w-5 h-5" />} title="Expectations">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Meet at least twice per month (in-person or virtual).</li>
                            <li>Set 1–2 SMART goals and track progress together.</li>
                            <li>Attend at least two M&amp;M events each semester.</li>
                        </ul>
                    </ProgramCard>
                    <ProgramCard icon={<HeartHandshake className="w-5 h-5" />} title="Benefits">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>Academic and career guidance from peers who&apos;ve been there.</li>
                            <li>Accountability, confidence, and stronger study habits.</li>
                            <li>Community and friendships that last beyond the semester.</li>
                        </ul>
                    </ProgramCard>
                </div>

                <div className="flex flex-wrap gap-3 mt-8">
                    <button disabled className="sase-primary-button opacity-50 cursor-not-allowed">Mentor Apps (Coming Soon)</button>
                    <button disabled className="sase-secondary-button opacity-50 cursor-not-allowed">Mentee Apps (Coming Soon)</button>
                    <Link href="/events" className="sase-secondary-button">See Past Events</Link>
                </div>
            </section>

            {/* Get in touch */}
            <section className="sase-content-section pb-12">
                <div className="bg-card rounded-2xl border border-border shadow-md p-8 max-w-2xl mx-auto">
                    <p className="text-muted-foreground mb-6">
                        Questions about programs or how to get started? Meet the team behind SASE and reach out with
                        any questions.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button disabled className="sase-primary-button opacity-50 cursor-not-allowed">Meet the Board (Coming Soon)</button>
                        <Link href="/events" className="sase-secondary-button">Upcoming Info Sessions</Link>
                    </div>
                </div>
            </section>
        </main>
    );
}

function ProgramCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-card rounded-2xl border border-border shadow-md p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-[#e9eef8] text-[#89abe3] p-2 rounded-full">{icon}</div>
                <h3 className="font-bold text-foreground text-base">{title}</h3>
            </div>
            {children}
        </div>
    );
}
