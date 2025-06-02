"use client"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import hero from "../public/hero.jpg";
import Image from "next/image";
export default function Home() {
    return (
        <div className="h-screen w-screen">
            <div className="flex h-1/2 relative">
                <Image src={hero} alt="hero" className="object-cover blur-sm " />
                <p className="absolute top-30 sm:text-4xl md:text-5xl lg:text-8xl font-semibold text-white ">UCF Society of Asian ​Scientists & Engineers</p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-10">
                <p className="text-4xl font-bold text-saseblue">Welcome to the UCF <span className="text-sasegreen">SASE</span> Website</p>
                <p className="text-2xl text-center lg:pr-40 lg:pl-40">
                    Since its founding in 2007, the Society of Asian Scientists and Engineers ​(SASE) has grown to a nationally recognized organization with 20,000 ​members worldwide, striving to help Asian heritage scientific and ​engineering professionals achieve their full potential. The University of ​Central Florida SASE Chapter was founded in 2020, shortly before the ​pandemic. With only 4 years under our belt, we have made tremendous ​strides towards the development of our members centered around core ​values of career, diversity, and service. Our events and programs not only ​advance professional pursuits, but also foster a supportive community that ​celebrates each and every member’s story.
                </p>

            </div>
            <div className="flex flex-col grow items-center space-y-4 p-10">
                <p className="text-4xl font-bold text-saseblue">Our Values</p>
                <Carousel
                    opts={{
                        align: "start",
                    }}
                    className="w-full max-w-sm"
                >
                    <CarouselContent>

                        <CarouselItem className="basis-1/2">
                            <div className="p-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-2xl">Professional Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-lg">
                                            We encourage members to ​leverage the experiences, ​knowledge, and skills gained ​through our organization to pursue ​their goals and aspirations.                        </p>
                                    </CardContent>
                                </Card>

                            </div>
                        </CarouselItem>
                        <CarouselItem className="basis-1/2"><Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">Service</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg">
                                    We commit ourselves to ​promoting service opportunities ​that enable our members to give ​back to the community and ​make a meaningful impact.</p>
                            </CardContent>
                        </Card>
                        </CarouselItem>
                        <CarouselItem className="basis-1/2">

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl">Diversity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg">
                                        We aim to empower our ​members by showcasing how ​their diverse backgrounds can ​broaden perspectives and ​inspire collaborative efforts.</p>
                                </CardContent>
                            </Card>
                        </CarouselItem>

                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </div>
    );
}
