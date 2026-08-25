import Image from "next/image";

export const metadata = {
    title: "Our Team – UCF SASE",
    description: "Meet the executive board and general board members of UCF SASE.",
};

const executiveBoard = [
    { name: "Kathy Nguyen", role: "President", img: "/officerheadshot/kathy.JPG" },
    { name: "William Douglass", role: "Internal Vice President", img: "/officerheadshot/will.jpg" },
    { name: "Christian De Mesa", role: "External Vice President", img: "/officerheadshot/christian.JPG" },
    { name: "Janna Alba", role: "Treasurer", img: "/officerheadshot/janna.JPG" },
    { name: "Rohan Rana", role: "Secretary", img: "/officerheadshot/rohan.JPG" },
    { name: "Kyan Nguyen", role: "Media Vice President", img: "/officerheadshot/kyan.jpg" },
];

const internalGBoard = [
    { name: "Johnny Nguyen", role: "Member Engagement", img: "/officerheadshot/johnny.JPG" },
    { name: "Jessica Do", role: "Member Engagement", img: "/officerheadshot/jess.jpg" },
    { name: "Timmynam Thai", role: "Cultural Chair", img: "/officerheadshot/timmy.jpg" },
    { name: "Brandon Phan", role: "Event Coordinator", img: "/officerheadshot/brandon.jpg" },
    { name: "Thanish Vijayashanker", role: "Event Coordinator", img: "/officerheadshot/thanish.JPG" },
    { name: "Man Munoz", role: "Event Coordinator", img: "/officerheadshot/man.jpeg" },
    { name: "Greg Kwon", role: "Service Chair", img: "/officerheadshot/greg.jpg" },
];

const externalGBoard = [
    { name: "Eric George", role: "CS Technical Chair", img: "/officerheadshot/eric.jpg" },
    { name: "Adam Dinh", role: "Engineering Technical Chair", img: "/officerheadshot/adam.jpg" },
    { name: "Ryan Hossain", role: "Science Chair", img: "/officerheadshot/ryanh.JPG" },
    { name: "Wesley Chou", role: "Professional Development Chair", img: "/officerheadshot/wes.jpg" },
    { name: "Mai Nguyen", role: "Professional Development Chair", img: "/officerheadshot/mai.jpg" },
];

const mediaGBoard = [
    { name: "Alyssa Xiong", role: "Creative Director", img: "/officerheadshot/alyssa.jpg" },
    { name: "Lily Nguyen", role: "Creative Director", img: "/officerheadshot/lily.jpg" },
    { name: "Allison Lunandy", role: "Historian", img: "/officerheadshot/allison.JPG" },
    { name: "Ryan Kreger", role: "Historian", img: "/officerheadshot/ryan.jpg" },
    { name: "Tiffany Havo", role: "Public Relations", img: "/officerheadshot/tiff.jpg" },
];

type Member = { name: string; role: string; img: string };

function MemberCard({ member, size = "md" }: { member: Member; size?: "lg" | "md" | "sm" }) {
    const imgSize = size === "lg" ? 180 : size === "sm" ? 100 : 140;
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
                    className={`${imgClass} rounded-full overflow-hidden ring-4 ring-[#89abe3]/30 group-hover:ring-[#89abe3] transition-all duration-300 shadow-lg group-hover:shadow-[0_0_30px_rgba(137,171,227,0.4)] group-hover:-translate-y-1`}
                    style={{ transform: "translateY(0)" }}
                >
                    <Image
                        src={member.img}
                        alt={member.name}
                        width={imgSize}
                        height={imgSize}
                        className="w-full h-full object-cover object-top transition-all duration-500"
                        quality={90}
                    />
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
                {/* subtle background decoration */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#89abe3]/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-[#dbc8b6]/20 blur-2xl translate-y-1/2 -translate-x-1/4" />
                </div>
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
