"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Image from "next/image"

const gbm1Images = [
    "/events/gbm1-1.JPG",
    "/events/gbm1-2.JPG",
    "/events/gbm1-3.JPG",
    "/events/gbm1-4.JPG",
    "/events/gbm1-5.JPG",
    "/events/gbm1-6.JPG",
]

const menmetImages = [
    "/events/menmet-1.png",
    "/events/menmet-2.png",
    "/events/menmet-3.png",
    "/events/menmet-4.png",
    "/events/menmet-6.png",
]

const gbm2Images = [
    "/events/gbm2-1.JPG",
    "/events/gbm2-2.JPG",
    "/events/gbm2-3.JPG",
    "/events/gbm2-4.JPG",
    "/events/gbm2-5.JPG",
    "/events/gbm2-6.JPG",
    "/events/gbm2-7.JPG",
]

const Page = () => {
    return (
        <div className="min-h-screen w-full overflow-x-clip flex flex-col items-center">
            <h1
                className="font-bold text-4xl sm:text-6xl py-4 sm:py-10 text-center text-saseblue"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                UPCOMING EVENTS
            </h1>

            <div
                className="flex justify-center items-center w-full px-2 sm:px-10 py-4 sm:py-10"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                <div className="w-full max-w-3xl aspect-video">
                    <iframe
                        src="https://calendar.google.com/calendar/embed?src=c_909abfda70bf7ddf91f64eda3c41fab321b06962ec46fdbb1708645c54b8928a%40group.calendar.google.com&ctz=America%2FNew_York"
                        className="w-full h-full rounded-md border-0"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>

            <h1
                className="font-bold text-4xl sm:text-6xl py-4 sm:py-10 text-center text-saseblue"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                PAST EVENTS
            </h1>
            <h1
                className="font-bold text-4xl sm:text-6xl py-4 sm:py-10 text-center"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                2024-2025
            </h1>

            <h2
                className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 text-center text-saseblue"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                {" "}
                GBM #1: DESPICABLE SASE
            </h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {gbm1Images.map((src, index) => (
                        <CarouselItem
                            key={index}
                            className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4"
                        >
                            <Image
                                src={src}
                                width={200}
                                height={100}
                                quality={80}
                                alt={`GBM1 ${index + 1}`}
                                className="object-cover w-full h-full rounded-md"
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>

            <h2
                className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                Mentor-mentee speed friending
            </h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {menmetImages.map((src, index) => (
                        <CarouselItem
                            key={index}
                            className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4"
                        >
                            <Image
                                src={src}
                                width={200}
                                height={100}
                                quality={80}
                                alt={`Mentor-Mentee ${index + 1}`}
                                className="object-cover w-full h-full rounded-md"
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>

            <h2
                className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue"
                data-aos="fade-up"
                data-aos-duration="1000"
            >
                GBM #2: SASe crossing
            </h2>
            <Carousel className="w-full max-w-7xl">
                <CarouselContent className="">
                    {gbm2Images.map((src, index) => (
                        <CarouselItem
                            key={index}
                            className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4"
                        >
                            <Image
                                src={src}
                                width={200}
                                height={100}
                                quality={80}
                                alt={`GBM2 ${index + 1}`}
                                className="object-cover w-full h-full rounded-md"
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>

            {/* 
      <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">IEEE x SASE Breadboarding workshop</h2>
      <Carousel className="w-full max-w-7xl">
          <CarouselContent className="">
              {images.map((image, index) => (
                  image.name.includes("breadboard") ?
                      <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                          <img src={image.url} alt={image.name} className="object-cover w-full h-full rounded-md" />
                      </CarouselItem> : null
              ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
      </Carousel>
      <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">sase service: lake lily</h2>
      <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
          <CarouselContent className="">
              {images.map((image, index) => (
                  image.name.includes("lakelily") ?
                      <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                          <img src={image.url} alt={image.name} className="object-cover w-full h-full rounded-md" />
                      </CarouselItem> : null
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
                  image.name.includes("gbm2") ?
                      <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                          <img src={image.url} alt={image.name} className="object-cover w-full h-full rounded-md" />
                      </CarouselItem> : null
              ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
      </Carousel>
      <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">Christmas Gbm</h2>
      <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
          <CarouselContent className="">
              {images.map((image, index) => (
                  image.name.includes("gbm2") ?
                      <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                          <img src={image.url} alt={image.name} className="object-cover w-full h-full rounded-md" />
                      </CarouselItem> : null
              ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
      </Carousel>
      <h2 className="font-bold text-3xl sm:text-5xl py-4 sm:py-10 uppercase text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">Corporate game night</h2>
      <Carousel className="w-full max-w-7xl" data-aos="fade-up" data-aos-duration="1000">
          <CarouselContent className="">
              {images.map((image, index) => (
                  image.name.includes("gbm2") ?
                      <CarouselItem key={index} className="flex justify-center align-middle basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 2xl:basis-1/4">
                          <img src={image.url} alt={image.name} className="object-cover w-full h-full rounded-md" />
                      </CarouselItem> : null
              ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
      </Carousel>
      */}
        </div>
    )
}

export default Page
