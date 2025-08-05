import Image from "next/image";

const executiveBoard = [
    {
        name: "Kathy Nguyen",
        role: "President",
        img: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
        name: "William Douglass",
        role: "Internal Vice President",
        img: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        name: "Christian De Mesa",
        role: "External Vice President",
        img: "https://randomuser.me/api/portraits/men/85.jpg",
    },
    {
        name: "Janna Alba",
        role: "Treasurer",
        img: "https://randomuser.me/api/portraits/men/44.jpg",
    },
    {
        name: "Rohan Rana",
        role: "Secretary",
        img: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
        name: "Kyan Nguyen",
        role: "Media Vice President",
        img: "https://randomuser.me/api/portraits/women/65.jpg",
    },
];

const internalGBoard = [
    {
        name: "Johnny Nguyen",
        role: "Member Engagement",
        img: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
        name: "Jessica Do",
        role: "Member Engagement",
        img: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        name: "Man Munoz",
        role: "Event Coordinator",
        img: "https://randomuser.me/api/portraits/men/85.jpg",
    },
    {
        name: "Thanish Vijayashanker",
        role: "Event Coordinator",
        img: "https://randomuser.me/api/portraits/men/44.jpg",
    },
    {
        name: "Greg Kwon",
        role: "Service Chair",
        img: "https://randomuser.me/api/portraits/women/65.jpg",
    },

];
const externalGBoard = [
    {
        name: "Eric George",
        role: "CS Technical Chair",
        img: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
        name: "Adam Dinh",
        role: "Engineering Technical Chair",
        img: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        name: "Ryan Hossain",
        role: "Science Chair",
        img: "https://randomuser.me/api/portraits/men/85.jpg",
    },
    {
        name: "Wesley Chou",
        role: "Professional Development Chair",
        img: "https://randomuser.me/api/portraits/men/44.jpg",
    },
    {
        name: "Mai Nguyen",
        role: "Professional Development Chair",
        img: "https://randomuser.me/api/portraits/women/65.jpg",
    },

];

const mediaGBoard = [
    {
        name: "Alyssa Xiong",
        role: "Creative Director",
        img: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
        name: "Lily Nguyen",
        role: "Creative Director",
        img: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        name: "Allison Lunandy",
        role: "Historian",
        img: "https://randomuser.me/api/portraits/men/85.jpg",
    },
    {
        name: "Ryan Kreger",
        role: "Historian",
        img: "https://randomuser.me/api/portraits/men/44.jpg",
    },
    {
        name: "Tiffany Havo",
        role: "Public Relations",
        img: "https://randomuser.me/api/portraits/women/65.jpg",
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
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-10 md:gap-20 w-full">
                    {executiveBoard.slice(4).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
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
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center  gap-10 md:gap-20 w-full">
                    {internalGBoard.slice(3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
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
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center  gap-10 md:gap-20 w-full">
                    {externalGBoard.slice(3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
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
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center  gap-10 md:gap-20 w-full">
                    {mediaGBoard.slice(3).map((member) => (
                        <div key={member.name} className="flex flex-col items-center w-full md:w-auto">
                            <Image
                                src={member.img}
                                alt={member.name}
                                width={120}
                                height={120}
                                className="rounded-full md:w-[160px] md:h-[160px] w-[100px] h-[100px]"
                            />
                            <div className="mt-3 md:mt-4 text-lg md:text-2xl font-bold font-sans text-center">{member.role}</div>
                            <div className="text-base md:text-xl font-sans text-center">{member.name}</div>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
}
