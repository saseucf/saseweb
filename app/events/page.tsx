"use client"

const Page = () => {

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
        </div>
    )
}

export default Page
