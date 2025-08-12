import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Crown, Medal } from "lucide-react"
// import patel from "../../public/patel.png"
// import blueorigin from "../../public/blueorigin.png"

const Page = () => {
    return (
        <div className="flex flex-col grow items-center space-y-4 p-10">
            <p className="text-5xl font-bold text-saseblue pb-10 " data-aos="fade-up" data-aos-duration="1000 pb-10">Sponsors</p>
            <p className="text-2xl sm:text-2xl px-4 sm:px-10 md:px-20 lg:px-60 text-center" data-aos="fade-up" data-aos-duration="1000">The University of Central Florida SASE Chapter works to
                maintain and grow a safe and inclusive environment for
                our members while also creating various opportunities for
                the advancement of member technical and interpersonal
                skills in preparation for the global business world.
                If you would like to help further our goals, please consider
                becoming a sponsor today!
                Contact our External Vice President, Christian De Mesa, at
                ucfsase.evp@gmail.com for any questions.</p>

            <div className="w-full max-w-screen-lg space-y-6" data-aos="fade-up" data-aos-duration="1000">
                <Card className="border-saseblue/30">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-white shadow">
                            <Crown className="h-5 w-5" />
                        </span>
                        <CardTitle className="text-3xl text-white text-center">Platinum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap justify-center items-center gap-8">
                            <Image
                                className="m-4 transition-transform duration-200 transform hover:scale-110"
                                src="/blueorigin.png"
                                alt="Blue Origin"
                                width={260}
                                height={130}
                                style={{ objectFit: "contain" }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-saseblue/20">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 text-white shadow">
                            <Medal className="h-5 w-5" />
                        </span>
                        <CardTitle className="text-2xl text-awardyellow">Gold</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap justify-center items-center gap-8">
                            <Image
                                className="m-4 transition-transform duration-200 transform hover:scale-110"
                                src="/patel.png"
                                alt="PGA"
                                width={220}
                                height={110}
                                style={{ objectFit: "contain" }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Page
