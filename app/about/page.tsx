"use client";
import { Pie, PieChart } from 'recharts';

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

import {
    Card,
    CardContent,
} from "@/components/ui/card"

import { Flower } from 'lucide-react';


const chartData = [
    { major: "compsci", percent: 26, fill: "#6ce5e8" },
    { major: "premed", percent: 15.7, fill: "#41b8d5" },
    { major: "meche", percent: 12.4, fill: "#2d8bba" },
    { major: "aero", percent: 9.1, fill: "#2f5f98" },
    { major: "bio", percent: 7, fill: "#31356e" },
    { major: "compeng", percent: 5.4, fill: "#5e3967" },
    { major: "indeng", percent: 3.7, fill: "#895273" },
    { major: "mateng", percent: 2.9, fill: "#b97286" },
    { major: "civeng", percent: 2.5, fill: "#e28385" },
    { major: "eleceng", percent: 2.1, fill: "#fe9273" },
    { major: "other", percent: 13.2, fill: "#ffa95a" }
]

const chartConfig = {
    compsci: {
        label: "Computer Science",
        color: "var(--chart-1)"
    },
    premed: {
        label: "Pre-Med/Pre-Health",
        color: "var(--chart-2)",
    },
    meche: {
        label: "Mechanical Engineering",
        color: "var(--chart-3)",
    },
    aero: {
        label: "Aerospace Engineering",
        color: "var(--chart-4)",
    },
    bio: {
        label: "Biology",
        color: "var(--chart-5)",
    },
    compeng: {
        label: "Computer Engineering",
        color: "var(--chart-6)",
    },
    indeng: {
        label: "Industrial Engineering",
        color: "var(--chart-7)",
    },
    mateng: {
        label: "Materials Engineering",
        color: "var(--chart-8)",
    },
    civeng: {
        label: "Civil Engineering",
        color: "var(--chart-9)",
    },
    eleceng: {
        label: "Electrical Engineering",
        color: "var(--chart-10)",
    },
    other: {
        label: "Other",
        color: "var(--chart-11)",
    }

} satisfies ChartConfig

const Page = () => {
    return (
        <div className="min-h-screen w-full overflow-x-clip flex flex-col items-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-center py-4 sm:py-10 text-saseblue" data-aos="fade-up" data-aos-duration="1000">
                ABOUT
            </h1>
            <p className="text-xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 text-center" data-aos="fade-up" data-aos-duration="1000">
                Since its founding in 2007, the Society of Asian Scientists and Engineers (SASE) has grown to a ​nationally recognized organization with 20,000 members worldwide, striving to help Asian heritage ​scientific and engineering professionals achieve their full potential.
            </p>
            <p className="text-xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 pt-4 sm:pt-10 text-center" data-aos="fade-up" data-aos-duration="1000">
                Founded shortly before the pandemic in 2020, the University of Central Florida SASE Chapter have ​made tremendous strides towards the development of our members centered around core values of ​leadership, professionalism, diversity, and service. Our events and programs not only advance our ​professional mission, but fosters a community that celebrates Asian heritage.
            </p>

            <p className="text-2xl sm:text-4xl font-semibold text-center py-4 sm:py-10 text-saseblue" data-aos="fade-up" data-aos-duration="1000">Mission Statement</p>
            <p className="text-xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 text-center" data-aos="fade-up" data-aos-duration="1000">
                We work to maintain and grow a safe and inclusive space for members that prioritizes pillars of ​professional development, culture, and community. We encourage members to leverage the ​experiences, knowledge, and skills gained through our organization to pursue their goals and ​aspirations. We aim to empower members by showcasing how their diverse cultural backgrounds can ​broaden perspectives and inspire collaborative efforts. We are committed to promoting service ​opportunities that allow members to give back to the community and make a meaningful impact. UCF ​SASE welcomes everyone, regardless of background or major!
            </p>
            <p className="text-2xl sm:text-4xl text-center font-semibold py-4 sm:py-10 text-saseblue" data-aos="fade-up" data-aos-duration="1000">Member Demographics</p>
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[500px] w-full p-4" data-aos="fade-up" data-aos-duration="1000"

            >
                <PieChart width={250} height={250}>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie data={chartData} dataKey="percent" nameKey="major" />
                </PieChart>
            </ChartContainer>
            <p className="text-4xl font-semibold text-center p-10 text-saseblue" data-aos="fade-up" data-aos-duration="1000">Awards & Accomplishments</p>
            <p className="text-xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 text-center" data-aos="fade-up" data-aos-duration="1000">In 2023, UCF SASE received the distinguished honor to host one of National SASE’s annual ​regional conferences, the SASE Southeast Regional Conference (SERC).</p>
            <div className="flex justify-center items-center p-10 w-full" data-aos="fade-up" data-aos-duration="1000">
                <div className='w-full max-w-2xl' data-aos="fade-up" data-aos-duration="1000">
                    <Card className="bg-awardyellow text-black transition-transform duration-200 transform hover:scale-110">
                        <CardContent>
                            <p className='pt-3 font-bold text-xl text-center'>2024-2025</p>
                            <p><Flower className="inline-block"></Flower> SASE Inspire Awards: Honorable Mention for Most Improved Chapter</p>
                            <p><Flower className="inline-block"></Flower> APAC Hidden Lotus Award: Organization of Distinction</p>
                            <p><Flower className="inline-block"></Flower> APAC Hidden Lotus Award: Most Improved Organization</p>
                            <p><Flower className="inline-block"></Flower> APAC Hidden Lotus Award: Best New Media Initiative</p>


                            <p className='font-bold text-xl text-center pt-3'>2023-2024</p>

                            <p className='pt-3'>

                                <Flower className="inline"></Flower>  APAC Hidden Lotus Award : Most Innovative Organization </p>
                            <p className='pt-3 font-bold text-xl text-center'>2022-2023</p>
                            <p className='pt-3'>


                                <Flower className="inline"></Flower>  APAC Hidden Lotus Award: Most Innovative Organization
                            </p>
                            <p><Flower className="inline-block"></Flower>  APAC Hidden Lotus Award: Organization of Distinction</p>
                            <p className='pt-3'>The Hidden Lotus Awards, presented by APAC (UCF’s Asian Pacific American ​Coalition), celebrates the work and impact of student organizations that promote ​cultural awareness, advocacy, and community engagement.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Page
