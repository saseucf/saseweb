import Image from "next/image";

const executiveBoard = [
    {
        name: "Kathy Nguyen",
        role: "President",
        img: "/officerheadshot/kathy.JPG",
    },
    {
        name: "William Douglass",
        role: "Internal Vice President",
    },
    {
        name: "Christian De Mesa",
        role: "External Vice President",
        img: "/officerheadshot/christian.JPG",
    },
    {
        name: "Janna Alba",
        role: "Treasurer",
        img: "/officerheadshot/janna.JPG",
    },
    {
        name: "Rohan Rana",
        role: "Secretary",
        img: "/officerheadshot/rohan.JPG",
    },
    {
        name: "Kyan Nguyen",
        role: "Media Vice President",
    },
];

const internalGBoard = [
    {
        name: "Johnny Nguyen",
        role: "Member Engagement",
        img: "/officerheadshot/johnny.JPG",
    },
    {
        name: "Jessica Do",
        role: "Member Engagement",
    },
    {
        name: "Man Munoz",
        role: "Event Coordinator",
        img: "/officerheadshot/man.jpeg",
    },
    {
        name: "Brandon Phan",
        role: "Event Coordinator",
    },
    {
        name: "Thanish Vijayashanker",
        role: "Event Coordinator",
        img: "/officerheadshot/thanish.JPG",
    },
    {
        name: "Greg Kwon",
        role: "Service Chair",
    },

];
const externalGBoard = [
    {
        name: "Eric George",
        role: "CS Technical Chair",
    },
    {
        name: "Adam Dinh",
        role: "Engineering Technical Chair",
    },
    {
        name: "Ryan Hossain",
        role: "Science Chair",
        img: "/officerheadshot/ryanh.JPG",
    },
    {
        name: "Wesley Chou",
        role: "Professional Development Chair",
    },
    {
        name: "Mai Nguyen",
        role: "Professional Development Chair",
    },

];

const mediaGBoard = [
    {
        name: "Alyssa Xiong",
        role: "Creative Director",
    },
    {
        name: "Lily Nguyen",
        role: "Creative Director",
    },
    {
        name: "Allison Lunandy",
        role: "Historian",
        img: "/officerheadshot/allison.JPG",
    },
    {
        name: "Ryan Kreger",
        role: "Historian",
    },
    {
        name: "Tiffany Havo",
        role: "Public Relations",
        img: "/officerheadshot/tiffany.jpeg",
    },

];


export default function Page() {
    return (
        <div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-sans text-center pt-20 text-saseblue mb-10 md:mb-14">Executive Board</h1>
            <div className="flex flex-col items-center gap-10 md:gap-16">
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20 w-full">
                    {executiveBoard.slice(0, 4).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={160}
                                    height={160}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={160}
                                height={160}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20 w-full">
                    {executiveBoard.slice(4).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={160}
                                    height={160}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={160}
                                height={160}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>


            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-sans text-center pt-30 mb-10 md:mb-14 text-saseblue">Internal G-Board</h1>
            <div className="flex flex-col items-center gap-10 md:gap-16">
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20 w-full">
                    {internalGBoard.slice(0, 3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={160}
                                    height={160}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={160}
                                height={160}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center  gap-10 md:gap-20 w-full">
                    {internalGBoard.slice(3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={160}
                                    height={160}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={160}
                                height={160}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>


            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold font-sans text-center pt-30 mb-10 md:mb-14 text-saseblue">External G-Board</h1>
            <div className="flex flex-col items-center gap-10 md:gap-16">
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20 w-full">
                    {externalGBoard.slice(0, 3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={160}
                                    height={160}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={160}
                                height={160}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center  gap-10 md:gap-20 w-full">
                    {externalGBoard.slice(3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={120}
                                    height={120}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={120}
                                height={120}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>


            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold font-sans text-center pt-30 mb-10 md:mb-14 text-saseblue">Media G-Board</h1>
            <div className="flex flex-col items-center gap-10 md:gap-16">
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20 w-full">
                    {mediaGBoard.slice(0, 3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={120}
                                    height={120}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={120}
                                height={120}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center  gap-10 md:gap-20 w-full">
                    {mediaGBoard.slice(3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            {member.img ? (
                                <Image
                                    src={member.img}
                                    alt={member.name}
                                    width={120}
                                    height={120}
                                    sizes="(min-width: 768px) 160px, 100px"
                                    quality={90}
                                    className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                                />
                            ) : (<Image
                                src="/avatar.png"
                                alt={member.name}
                                width={120}
                                height={120}
                                sizes="(min-width: 768px) 160px, 100px"
                                quality={90}
                                className="rounded-full object-cover md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />)}

                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
}
