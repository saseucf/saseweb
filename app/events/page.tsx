"use client"

const Page = () => {

    return (
        <div>
            <h1 className="font-bold text-6xl p-10 text-center text-saseblue" data-aos="fade-up" data-aos-duration="1000">UPCOMING EVENTS</h1>
            <div className="flex justify-center items-center p-10" data-aos="fade-up" data-aos-duration="1000">
                <iframe src="https://calendar.google.com/calendar/embed?src=c_909abfda70bf7ddf91f64eda3c41fab321b06962ec46fdbb1708645c54b8928a%40group.calendar.google.com&ctz=America%2FNew_York" width="800" height="600"></iframe>
            </div>
        </div>
    )
}

export default Page