"use client"


import supabase from "@/lib/auth"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useEffect, useState } from "react"


const imageFetch = async () => {
    const { data, error } = await supabase.storage.from('gbm1').list('public', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
    })
    console.log("Data fetched from Supabase:", data)
    if (error) {
        console.error("Error fetching images:", error)
        return []
    }
    console.log("Fetched images:", data)
    return data.map(file => (supabase.storage.from('gbm1/public').getPublicUrl(file.name).data.publicUrl))
}

const Page = () => {
    const [images, setimages] = useState<string[]>([])
    const fetchImages = async () => {
        const fetchedImages = await imageFetch()
        console.log("Fetched images in component:", fetchedImages)
        setimages(fetchedImages)
    }

    useEffect(() => {
        fetchImages()
    }, [])

    return (
        <div className="min-h-screen w-full overflow-x-clip flex flex-col items-center">
            <h1 className="font-bold text-4xl sm:text-6xl py-4 sm:py-10 text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">UPCOMING EVENTS</h1>

            <div className="flex justify-center items-center w-full px-2 sm:px-10 py-4 sm:py-10" data-aos="fade-up" data-aos-duration="1000">
                <div className="w-full max-w-3xl aspect-video">
                    <iframe
                        src="https://calendar.google.com/calendar/embed?src=c_909abfda70bf7ddf91f64eda3c41fab321b06962ec46fdbb1708645c54b8928a%40group.calendar.google.com&ctz=America%2FNew_York"
                        className="w-full h-full rounded-md border-0"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
            <h1 className="font-bold text-4xl sm:text-6xl py-4 sm:py-10 text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">PAST EVENTS</h1>
            <h1 className="font-bold text-4xl sm:text-6xl py-4 sm:py-10 text-center" data-aos="fade-up" data-aos-duration="1000">2024-2025</h1>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000"> GBM #1: DESPICABLE SASE</h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>

            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">Mentor-mentee speed friending</h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">GBM #2: SASe crossing</h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">IEEE x SASE Breadboarding workshop</h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">sase service: lake lily</h2>
            <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h1 className="font-bold text-3xl sm:text-6xl py-4 sm:py-10 text-center mt-10" data-aos="fade-up" data-aos-duration="1000">2023-2024</h1>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">Everything everywhere all at once gbm</h2>
            <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">Christmas Gbm</h2>
            <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">Corporate game night</h2>
            <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
                <CarouselContent className="">
                    {images.map((image, index) => (
                        <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                            <img src={image} alt={"test"} className="object-cover w-full h-full rounded-md" />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    )
}


export default Page
