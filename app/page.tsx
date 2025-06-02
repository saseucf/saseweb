"use client"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Briefcase } from "lucide-react";
import hero from "../public/hero.jpg";
import saselogo from "../public/saselogo.png"
import Image from "next/image";
export default function Home() {
    return (
        <div className="h-screen w-screen">
            <div className="flex h-full relative">
                <Image src={hero} alt="hero" className="object-cover blur-sm " />
                <p className="absolute top-90 sm:text-4xl md:text-5xl lg:text-8xl font-semibold text-white spacing -tracking-[0.25rem]">UCF Society of Asian ​Scientists & Engineers</p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-10">
                <p className="text-4xl font-bold text-saseblue">Welcome to the UCF <span className="text-sasegreen">SASE</span> Website</p>
                <p className="text-2xl text-center lg:pr-40 lg:pl-40">
                    Since its founding in 2007, the Society of Asian Scientists and Engineers ​(SASE) has grown to a nationally recognized organization with 20,000 ​members worldwide, striving to help Asian heritage scientific and ​engineering professionals achieve their full potential. The University of ​Central Florida SASE Chapter was founded in 2020, shortly before the ​pandemic. With only 4 years under our belt, we have made tremendous ​strides towards the development of our members centered around core ​values of career, diversity, and service. Our events and programs not only ​advance professional pursuits, but also foster a supportive community that ​celebrates each and every member’s story.
                </p>

            </div>
            <div className="flex flex-col grow items-center space-y-4 p-10">
                <p className="text-5xl font-bold text-saseblue italic">3 Core Values</p>

                <div className="flex">
                    <Card className="m-1 border-0 bg-linear-65 from-sasegreen to-saseblue transition-transform duration-200 transform hover:scale-110">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center ">Professional Development </CardTitle>
                            <div className="flex justify-center">
                                <Briefcase size={32} className=""></Briefcase>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl">
                                We encourage members to ​leverage the experiences, ​knowledge, and skills gained ​through our organization to pursue ​their goals and aspirations.                        </p>
                        </CardContent>
                    </Card>
                    <Card className="m-1 border-0 bg-linear-65 from-sasegreen to-saseblue transition-transform duration-200 transform hover:scale-110">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Service</CardTitle>
                            <div className="flex justify-center">
                                <Briefcase size={32} className=""></Briefcase>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">
                                We commit ourselves to ​promoting service opportunities ​that enable our members to give ​back to the community and ​make a meaningful impact.</p>
                        </CardContent>
                    </Card>
                    <Card className="m-1 border-0 bg-linear-65 from-sasegreen to-saseblue transition-transform duration-200 transform hover:scale-110">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Diversity</CardTitle>
                            <div className="flex justify-center">
                                <Briefcase size={32} className=""></Briefcase>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">
                                We aim to empower our ​members by showcasing how ​their diverse backgrounds can ​broaden perspectives and ​inspire collaborative efforts.</p>
                        </CardContent>
                    </Card>
                </div>


            </div>
            <div className="flex flex-col grow items-center space-y-4 p-10">
                <p className="text-5xl font-bold text-saseblue">SPONSORS</p>
                <p className="text-2xl">The University of Central Florida SASE Chapter works to
                    maintain and grow a safe and inclusive environment for
                    our members while also creating various opportunities for
                    the advancement of member technical and interpersonal
                    skills in preparation for the global business world.
                    If you would like to help further our goals, please consider
                    becoming a sponsor today!
                    Contact our External Vice President, Christian De Mesa, at
                    ucfsase.evp@gmail.com for any questions.</p>

                <div className="flex flex-row">
                    <Image className="m-10 grayscale-100" src={saselogo} alt="sponsorlogo" height={200} width={200}></Image>
                    <Image className="m-10 grayscale-100" src={saselogo} alt="sponsorlogo" height={200} width={200}></Image>
                    <Image className="m-10 grayscale-100" src={saselogo} alt="sponsorlogo" height={200} width={200}></Image>
                </div>
            </div>

        </div>
    );
}
