"use client"
import hero from "../public/hero.jpg";
import Image from "next/image";
export default function Home() {
    return (
        <div className="grid h-screen w-screen grid-rows-2">
            <div className="flex h-1/1.5 relative">
                <Image src={hero} alt="hero" className="object-cover blur-sm " />
                <p className="absolute top-30 text-9xl font-semibold">UCF Society of Asian ​Scientists & Engineers</p>
            </div>
            <div className="flex flex-col items-center space-y-4 p-10">
                <p className="text-4xl font-semibold">Welcome to the UCF SASE Website</p>
                <p className="text-2xl text-center pr-40 pl-40">
                    Since its founding in 2007, the Society of Asian Scientists and Engineers ​(SASE) has grown to a nationally recognized organization with 20,000 ​members worldwide, striving to help Asian heritage scientific and ​engineering professionals achieve their full potential. The University of ​Central Florida SASE Chapter was founded in 2020, shortly before the ​pandemic. With only 4 years under our belt, we have made tremendous ​strides towards the development of our members centered around core ​values of career, diversity, and service. Our events and programs not only ​advance professional pursuits, but also foster a supportive community that ​celebrates each and every member’s story.
                </p>
            </div>
        </div>
    );
}
