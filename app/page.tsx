"use client"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"



import { Montserrat } from "next/font/google";

import { Briefcase, HandHeart, HeartHandshake } from "lucide-react";
import hero from "../public/hero.jpg";
import Image from "next/image";
import ucfsase from "../public/ucfsaselogo.png"


const montfont = Montserrat({
    subsets: ['latin'],
    display: 'swap',
})
export default function Home() {

    return (
        <div className="w-full overflow-x-clip">
            <div className="flex h-full relative w-full" >
                <Image src={hero} alt="hero" className="object-cover grayscale-60 blur-xs w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]" />
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-black/40 z-0"></div>
                </div>
                <div className="absolute inset-0 flex flex-row justify-center items-center gap-6 px-4">
                    <Image
                        src={ucfsase}
                        alt="saselogo"
                        className="w-full max-w-xs sm:max-w-md md:max-w-lg h-auto"
                        sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                    />
                    <div className="hidden md:flex flex-col items-center justify-center relative z-10">
                        <span className="bg-gradient-to-r from-saseblue to-sasegreen bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-tight text-center px-4 py-2 rounded-xl backdrop-blur-md bg-white/20">
                            Society of Asian Scientists and Engineers
                        </span>
                    </div>
                </div>
                {/* <p
                    className={`
    ${montfont.className}
    absolute
    w-full
    px-4
    text-center
    break-words
    top-1/4
    sm:top-1/3
    md:top-[30%]
    -translate-y-1/2
    text-2xl
    sm:text-4xl
    md:text-6xl
    lg:text-8xl
    font-bold
    lg:-tracking-[0.25rem]
    text-saseblue
  `}
                    data-aos="fade-up"
                    data-aos-duration="1000"
                >
                    UCF Society of Asian ​Scientists & Engineers
                </p> */}
            </div>
            <div className="flex flex-col items-center space-y-4 p-10" >
                <p className={`${montfont.className} text-4xl text-center font-black pb-10`} data-aos="fade-up" data-aos-duration="1000">
                    Welcome to the UCF <span className="bg-gradient-to-r from-saseblue to-sasegreen bg-clip-text text-transparent font-black">SASE</span> Website
                </p>
                <p className="text-2xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 text-center" data-aos="fade-up" data-aos-duration="1000">
                    Since its founding in 2007, the Society of Asian Scientists and Engineers ​(SASE) has grown to a nationally recognized organization with 20,000 ​members worldwide, striving to help Asian heritage scientific and ​engineering professionals achieve their full potential. The University of ​Central Florida SASE Chapter was founded in 2020, shortly before the ​pandemic. With only 4 years under our belt, we have made tremendous ​strides towards the development of our members centered around core ​values of career, diversity, and service. Our events and programs not only ​advance professional pursuits, but also foster a supportive community that ​celebrates each and every member’s story.
                </p>

            </div>
            <div className="flex flex-col grow items-center space-y-4 p-4 sm:p-10 md:p-20 lg:p-40">
                <p className={'${montfont.className} text-5xl font-bold text-saseblue pb-10'} data-aos="fade-up" data-aos-duration="1000">3 Core Values</p>

                <div className="flex flex-wrap justify-center gap-6 w-full max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg" data-aos="fade-up" data-aos-duration="1000">
                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue transition-transform duration-200 transform hover:scale-105 w-full sm:w-80 md:w-96 lg:w-[28rem] max-w-full p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="text-2xl text-center">Professional Development</CardTitle>
                                <div className="flex justify-center">
                                    <Briefcase size={32} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl">
                                    We encourage members to ​leverage the experiences, ​knowledge, and skills gained ​through our organization to pursue ​their goals and aspirations.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue transition-transform duration-200 transform hover:scale-105 w-full sm:w-80 md:w-96 lg:w-[28rem] max-w-full p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="text-2xl text-center">Service</CardTitle>
                                <div className="flex justify-center">
                                    <HandHeart size={32} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">
                                    We commit ourselves to ​promoting service opportunities ​that enable our members to give ​back to the community and ​make a meaningful impact.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="rounded-2xl bg-linear-65 from-sasegreen to-saseblue transition-transform duration-200 transform hover:scale-105 w-full sm:w-80 md:w-96 lg:w-[28rem] max-w-full p-1">
                        <Card className="border border-saseblue shadow-lg rounded-2xl h-full">
                            <CardHeader>
                                <CardTitle className="text-2xl text-center">Diversity</CardTitle>
                                <div className="flex justify-center">
                                    <HeartHandshake size={32} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">
                                    We aim to empower our ​members by showcasing how ​their diverse backgrounds can ​broaden perspectives and ​inspire collaborative efforts.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>


            </div>
        </div >
    );
}
