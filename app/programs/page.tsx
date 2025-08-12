"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Rocket,
    Users,
    CalendarCheck,
    ClipboardList,
    HeartHandshake,
    Star,
} from "lucide-react";

const Page = () => {
    return (
        <div className="min-h-screen w-full overflow-x-clip flex flex-col items-center">
            <h1
                className="text-4xl sm:text-6xl font-bold text-center py-4 sm:py-10 text-saseblue"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                PROGRAMS
            </h1>

            <p
                className="text-xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 text-center"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                UCF SASE offers hands-on programs designed to grow leadership,
                professionalism, and community. Explore our Intern Program and our
                Mentor–Mentee Program to get involved, build skills, and connect with
                peers and professionals.
            </p>

            {/* Intern Program */}
            <section className="w-full flex flex-col items-center pt-8 sm:pt-12">
                <h2
                    className="text-3xl sm:text-5xl font-semibold text-center pt-5 text-saseblue"
                    data-aos="fade-up"
                    data-aos-duration="1000"
                >
                    Intern Program
                </h2>
                <p
                    className="text-lg sm:text-xl px-4 sm:px-10 md:px-20 lg:px-60 text-center pt-4"
                    data-aos="fade-up"
                    data-aos-duration="1000"
                >
                    The SASE Intern Program is a semester-long experience for new and
                    returning members to gain leadership exposure by shadowing officers,
                    contributing to committees, and delivering a capstone project. Interns
                    get real responsibility, 1–1 guidance, and a clear path toward future
                    officer roles.
                </p>

                <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 p-4 sm:p-6 md:p-8" data-aos="fade-up" data-aos-duration="1000">
                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Rocket className="text-saseblue" /> What You'll Do
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    <li>Shadow officers across committees (Ops, Events, Marketing, Outreach, Tech).</li>
                                    <li>Help plan and run GBMs, workshops, and socials.</li>
                                    <li>Complete a team-based intern capstone to showcase impact.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Star className="text-saseblue" /> Benefits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    <li>1–1 mentorship and professional development.</li>
                                    <li>Resume-ready leadership experience and project work.</li>
                                    <li>Priority consideration for future officer applications.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <CalendarCheck className="text-saseblue" /> Timeline & Commitment
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    <li>Time: ~2–4 hours/week during the semester.</li>
                                    <li>Kickoff and training early semester; capstone showcase near the end.</li>
                                    <li>Flexible roles to match availability and interests.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center py-4 sm:py-6" data-aos="fade-up" data-aos-duration="1000">
                    <Link href="/register">
                        <Button size="lg" className="bg-saseblue text-white hover:brightness-110">
                            Apply / Register Interest
                        </Button>
                    </Link>
                    <Link href="/events">
                        <Button size="lg" variant="outline">
                            Find Info Sessions & GBMs
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Mentor–Mentee Program */}
            <section className="w-full flex flex-col items-center pt-8 sm:pt-16">
                <h2
                    className="text-3xl sm:text-5xl font-semibold text-center text-saseblue"
                    data-aos="fade-up"
                    data-aos-duration="1000"
                >
                    Mentor–Mentee Program
                </h2>
                <p
                    className="text-lg sm:text-xl px-4 sm:px-10 md:px-20 lg:px-60 text-center pt-4"
                    data-aos="fade-up"
                    data-aos-duration="1000"
                >
                    Our Mentor–Mentee Program pairs members for peer guidance, academic
                    support, and career growth. Whether you want to share experience as a
                    mentor or get tailored advice as a mentee, you'll join a network
                    that empowers you to set goals and stay accountable.
                </p>

                <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6 p-4 sm:p-6 md:p-8" data-aos="fade-up" data-aos-duration="1000">
                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Users className="text-saseblue" /> How It Works
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    <li>Kickoff with Speed Friending to meet potential matches.</li>
                                    <li>Pairs matched by major, year, interests, and goals.</li>
                                    <li>Optional mini-cohorts and themed socials throughout the term.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <ClipboardList className="text-saseblue" /> Expectations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    <li>Meet at least twice per month (in-person or virtual).</li>
                                    <li>Set 1–2 SMART goals and track progress together.</li>
                                    <li>Attend at least two M&M events each semester.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <HeartHandshake className="text-saseblue" /> Benefits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-6 space-y-2 text-base">
                                    <li>Academic and career guidance from peers who've been there.</li>
                                    <li>Accountability, confidence, and stronger study habits.</li>
                                    <li>Community and friendships that last beyond the semester.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center py-4 sm:py-6" data-aos="fade-up" data-aos-duration="1000">
                    <Link href="/register">
                        <Button size="lg" className="bg-saseblue text-white hover:brightness-110">
                            Become a Mentor
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button size="lg" variant="outline">
                            Become a Mentee
                        </Button>
                    </Link>
                    <Link href="/resources">
                        <Button size="lg" variant="outline">
                            Program Guide & Resources
                        </Button>
                    </Link>
                    <Link href="/events">
                        <Button size="lg" variant="outline">
                            See Past Events
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Get in touch */}
            <section className="w-full flex flex-col items-center pt-6 pb-12">
                <p
                    className="text-lg sm:text-xl px-4 sm:px-10 md:px-20 lg:px-60 text-center"
                    data-aos="fade-up"
                    data-aos-duration="1000"
                >
                    Questions about programs or how to get started? Meet the team behind
                    SASE and reach out with any questions.
                </p>
                <div className="flex gap-3 pt-4" data-aos="fade-up" data-aos-duration="1000">
                    <Link href="/about/board">
                        <Button size="lg">
                            Meet the Board
                        </Button>
                    </Link>
                    <Link href="/events">
                        <Button size="lg" variant="outline">
                            Upcoming Info Sessions
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Page;
