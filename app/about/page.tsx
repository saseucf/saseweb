"use client";
import { Pie, PieChart } from 'recharts';

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"



export const description = "A simple pie chart"

const chartData = [
    { major: "compsci", percent: 26, fill: "var(--chart-1)" },
    { major: "premed", percent: 15.7, fill: "var(--chart-2)" },
    { major: "meche", percent: 12.4, fill: "var(--chart-3)" },
    { major: "aero", percent: 9.1, fill: "var(--chart-4)" },
    { major: "bio", percent: 7, fill: "var(--chart-5)" },
    { major: "compeng", percent: 5.4, fill: "var(--chart-6)" },
    { major: "indeng", percent: 3.7, fill: "var(--chart-6)" },
    { major: "mateng", percent: 2.9, fill: "var(--chart-6)" },
    { major: "civeng", percent: 2.5, fill: "var(--chart-6)" },
    { major: "eleceng", percent: 2.1, fill: "var(--chart-6)" },
    { major: "other", percent: 13.2, fill: "var(--chart-6)" }
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
        <div className="grid grid-rows-1">
            <h1 className="text-4xl font-semibold text-center p-10">
                About
            </h1>
            <p className="text-2xl text-center pr-40 pl-40">
                Since its founding in 2007, the Society of Asian Scientists and Engineers (SASE) has grown to a ​nationally recognized organization with 20,000 members worldwide, striving to help Asian heritage ​scientific and engineering professionals achieve their full potential.
            </p>
            <p className="text-2xl text-center pr-40 pl-40">
                Founded shortly before the pandemic in 2020, the University of Central Florida SASE Chapter have ​made tremendous strides towards the development of our members centered around core values of ​leadership, professionalism, diversity, and service. Our events and programs not only advance our ​professional mission, but fosters a community that celebrates Asian heritage.
            </p>

            <p className="text-4xl font-semibold text-center p-10">Mission Statement</p>
            <p className="text-2xl text-center pr-40 pl-40">
                We work to maintain and grow a safe and inclusive space for members that prioritizes pillars of ​professional development, culture, and community. We encourage members to leverage the ​experiences, knowledge, and skills gained through our organization to pursue their goals and ​aspirations. We aim to empower members by showcasing how their diverse cultural backgrounds can ​broaden perspectives and inspire collaborative efforts. We are committed to promoting service ​opportunities that allow members to give back to the community and make a meaningful impact. UCF ​SASE welcomes everyone, regardless of background or major!
            </p>
            <p className="text-4xl font-semibold text-center p-10">Member Demographics</p>
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[500px] w-full p-4"

            >
                <PieChart width={250} height={250}>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie data={chartData} dataKey="percent" nameKey="major" />
                </PieChart>
            </ChartContainer>
            <p className="text-4xl font-semibold text-center p-10">Awards & Accomplishments</p>

        </div>
    )
}

export default Page