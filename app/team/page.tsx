

export const metadata = {
    title: "Our Team – UCF SASE",
    description: "Meet the executive board and general board members of UCF SASE.",
};

const executiveBoard = [
    { name: "Jessica Do", role: "President", img: "" },
    { name: "Rohan Rana", role: "Internal Vice President", img: "" },
    { name: "Adam Dinh", role: "External Vice President", img: "" },
    { name: "Andres Padron", role: "Treasurer", img: "" },
    { name: "Ryan Kreger", role: "Secretary", img: "" },
    { name: "Zulekha Patel", role: "Media Vice President", img: "" },
];

const internalGBoard = [
    { name: "Princess Arrozal", role: "Member Engagement Chair", img: "" },
    { name: "Keira Fukuda", role: "Member Engagement Chair", img: "" },
    { name: "Fahd Shahid", role: "Event Coordinator", img: "" },
    { name: "Sima Suvarna", role: "Service Chair", img: "" },
    { name: "Alex Trieu", role: "Sports Coordinator", img: "" },
];

const externalGBoard = [
    { name: "Chau Le", role: "Professional Development Chair", img: "" },
    { name: "Daniyl Nguyen", role: "Professional Development Chair", img: "" },
    { name: "Sami Judeh", role: "Engineering Technical Chair", img: "" },
    { name: "Pranavsai Gandikota", role: "CS Technical Chair", img: "" },
    { name: "Laurence Cariaga", role: "Science Chair", img: "" },
    { name: "Sammi Jones", role: "Project Chair", img: "" },
    { name: "Rishit Nagula", role: "Project Chair", img: "" },
];

const mediaGBoard = [
    { name: "Vanessa Dao", role: "Creative Director", img: "" },
    { name: "Sydney Tran", role: "Creative Director", img: "" },
    { name: "Rita Gau", role: "Historian", img: "" },
    { name: "Cody Tran", role: "Historian", img: "" },
    { name: "Jane Inigo Prince", role: "Public Relations", img: "" },
];

import { User } from "lucide-react";

type Member = { name: string; role: string; img: string };

function MemberCard({ member, size = "md" }: { member: Member; size?: "lg" | "md" | "sm" }) {
    const imgClass =
        size === "lg"
            ? "w-[140px] h-[140px] md:w-[180px] md:h-[180px]"
            : size === "sm"
            ? "w-[100px] h-[100px]"
            : "w-[110px] h-[110px] md:w-[140px] md:h-[140px]";
    const nameClass =
        size === "lg" ? "text-base md:text-lg font-black" : "text-sm md:text-base font-bold";
    const roleClass = size === "lg" ? "text-xs md:text-sm" : "text-xs";

    return (
        <div className="group flex flex-col items-center text-center gap-3">
            <div className="relative">
                <div
                    className={`${imgClass} rounded-full overflow-hidden ring-4 ring-[#89abe3]/30 group-hover:ring-[#89abe3] transition-all duration-300 shadow-lg group-hover:shadow-[0_0_30px_rgba(137,171,227,0.4)] group-hover:-translate-y-1 bg-muted flex items-center justify-center`}
                    style={{ transform: "translateY(0)" }}
                >
                    <User className={`text-muted-foreground ${size === "lg" ? "w-16 h-16 md:w-20 md:h-20" : size === "sm" ? "w-10 h-10" : "w-12 h-12 md:w-16 md:h-16"}`} />
                </div>
                {/* glow dot */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#89abe3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_#89abe3]" />
            </div>
            <div>
                <p className={`text-foreground ${nameClass}`}>{member.name}</p>
                <p className={`text-muted-foreground ${roleClass} mt-0.5 max-w-[130px]`}>{member.role}</p>
            </div>
        </div>
    );
}

function SectionHeading({ label, title }: { label: string; title: string }) {
    return (
        <div className="text-center mb-12">
            <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">
                {label}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{title}</h2>
        </div>
    );
}

export default function TeamPage() {
    return (
        <main className="sase-page">
            {/* Hero Header */}
            <div className="sase-page-header relative overflow-hidden">
                <p className="sase-eyebrow relative z-10">UCF SASE / Team</p>
                <h1 className="relative z-10">Meet the Team</h1>
                <p className="relative z-10 mt-2 text-muted-foreground max-w-xl mx-auto">
                    The dedicated officers behind UCF SASE — building community, driving growth, and representing our members.
                </p>
            </div>

            {/* ── Executive Board ── */}
            <section className="sase-content-section">
                <SectionHeading label="Leadership" title="Executive Board" />

                {/* Top row: 3 */}
                <div className="flex flex-wrap justify-center gap-10 md:gap-16 mb-12">
                    {executiveBoard.slice(0, 3).map((m) => (
                        <MemberCard key={m.name} member={m} size="lg" />
                    ))}
                </div>
                {/* Bottom row: 3 */}
                <div className="flex flex-wrap justify-center gap-10 md:gap-16">
                    {executiveBoard.slice(3).map((m) => (
                        <MemberCard key={m.name} member={m} size="lg" />
                    ))}
                </div>
            </section>

            {/* ── Internal G-Board ── */}
            <section className="sase-content-section">
                <SectionHeading label="Internal Affairs" title="Internal G-Board" />
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {internalGBoard.map((m) => (
                        <MemberCard key={m.name} member={m} size="md" />
                    ))}
                </div>
            </section>

            {/* ── External G-Board ── */}
            <section className="sase-content-section">
                <SectionHeading label="External Affairs" title="External G-Board" />
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {externalGBoard.map((m) => (
                        <MemberCard key={m.name} member={m} size="md" />
                    ))}
                </div>
            </section>

            {/* ── Media G-Board ── */}
            <section className="sase-content-section pb-16">
                <SectionHeading label="Creative & Media" title="Media G-Board" />
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    {mediaGBoard.map((m) => (
                        <MemberCard key={m.name} member={m} size="md" />
                    ))}
                </div>
            </section>
        </main>
    );
}
