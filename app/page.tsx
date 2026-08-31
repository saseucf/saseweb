import Link from "next/link";
import Image from "next/image";
import { Briefcase, HandHeart, HeartHandshake } from "lucide-react";
import Leaderboard from "@/components/Leaderboard";
import AosInit from "@/components/AosInit";

export default function Home() {
  return (
    <main className="sase-home">
      <AosInit />
      <section className="relative flex flex-col justify-center min-h-[95vh] pt-20 pb-0 overflow-hidden bg-background">
        {/* Background Elements (z-0) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Sun and Clouds */}
          <div className="sase-sun" aria-hidden="true" style={{ top: '15%', right: '5%', position: 'absolute' }} />
          <div className="sase-cloud sase-cloud-top" aria-hidden="true" style={{ top: '25%', right: '12%', position: 'absolute' }} />
          <div className="sase-cloud sase-cloud-middle" aria-hidden="true" style={{ top: '55%', right: '40%', position: 'absolute' }} />
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10 mb-[15vh] md:mb-[25vh]" data-aos="fade-up">
          <div className="flex flex-col items-start gap-2 max-w-2xl">
            <div className="flex items-center gap-4 md:gap-6 mb-4 md:pl-[60px]">
              {/* Dark Mode Logo */}
              <Image 
                src="/logo-hero.png" 
                alt="SASE Society of Asian Scientists & Engineers" 
                width={800} 
                height={200} 
                className="w-[320px] md:w-[600px] h-auto object-contain drop-shadow-lg hidden dark:block" 
                priority
              />
              {/* Light Mode Logo */}
              <Image 
                src="/logo-dark-twotone.png" 
                alt="SASE Society of Asian Scientists & Engineers" 
                width={800} 
                height={200} 
                className="w-[320px] md:w-[600px] h-auto object-contain drop-shadow-lg block dark:hidden" 
                priority
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-4 md:pl-[60px]">
              <Link href="/checkin" className="bg-[#89abe3] hover:bg-foreground hover:text-background text-foreground font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-3 md:py-4 rounded shadow-lg transition-colors">
                Check-in
              </Link>
              <Link href="/events" className="bg-foreground text-background hover:bg-[#89abe3] hover:text-foreground font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-3 md:py-4 rounded shadow-lg transition-colors">
                See Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 bg-background text-foreground py-24 px-6 md:px-12 mt-32">
        <div className="max-w-4xl mx-auto text-center space-y-8" data-aos="fade-up">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Welcome to the <span className="text-[#fbbf24]">UCF</span> <span className="text-[#89abe3]">SASE</span> Website
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Since its founding in 2007, the Society of Asian Scientists and Engineers (SASE) has grown to a nationally recognized organization with 20,000 members worldwide, striving to help Asian heritage scientific and engineering professionals achieve their full potential. The University of Central Florida SASE Chapter was founded in 2020, shortly before the pandemic. With only 5 years under our belt, we have made tremendous strides towards the development of our members centered around core values of career, diversity, and service. Our events and programs not only advance professional pursuits, but also foster a supportive community that celebrates each and every member’s story.
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="relative z-10 bg-background text-foreground pb-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-center text-[#89abe3] font-black text-4xl mb-16 tracking-tight" data-aos="fade-up">
            3 Core Values
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-aos="fade-up" data-aos-delay="200">
            <div className="bg-background rounded-2xl p-8 border border-border shadow-md hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
              <div className="bg-[#e9eef8] dark:bg-muted text-[#89abe3] p-4 rounded-full mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold mb-4">Professional Development</h4>
              <p className="text-muted-foreground leading-relaxed">
                We encourage members to leverage the experiences, knowledge, and skills gained through our organization to pursue their goals and aspirations.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-8 border border-border shadow-md hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
              <div className="bg-[#e9eef8] dark:bg-muted text-[#89abe3] p-4 rounded-full mb-6">
                <HandHeart className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold mb-4">Service</h4>
              <p className="text-muted-foreground leading-relaxed">
                We commit ourselves to promoting service opportunities that enable our members to give back to the community and make a meaningful impact.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-8 border border-border shadow-md hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
              <div className="bg-[#e9eef8] dark:bg-muted text-[#89abe3] p-4 rounded-full mb-6">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold mb-4">Diversity</h4>
              <p className="text-muted-foreground leading-relaxed">
                We aim to empower our members by showcasing how their diverse backgrounds can broaden perspectives and inspire collaborative efforts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="relative z-10 bg-background pb-24 px-6 md:px-12">
        <Leaderboard />
      </section>

      {/* Sponsors Section */}
      <section className="relative z-10 bg-foreground text-background py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">
              Thank You
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-background tracking-tight">Our Sponsors</h2>
            <p className="mt-3 text-[#89abe3] max-w-xl mx-auto text-sm leading-relaxed">
              <span className="text-[#fbbf24]">UCF</span> SASE is made possible by the generous support of our sponsors. Interested in partnering with us?
              Reach out to our External VP at{" "}
              <a href="mailto:ucfsase.evp@gmail.com" className="underline hover:text-[#dbc8b6] transition-colors">ucfsase.evp@gmail.com</a>.
            </p>
          </div>

          <div className="mb-10">
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#fbbf24]/50" />
              <span className="flex items-center gap-2 text-xs font-black tracking-[0.15em] uppercase text-[#fbbf24]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                Platinum Sponsor
              </span>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#fbbf24]/50" />
            </div>
            <div className="flex justify-center">
              <a href="https://www.blueorigin.com" target="_blank" rel="noopener noreferrer"
                className="group bg-card/5 hover:bg-card/10 border border-white/10 hover:border-[#89abe3]/50 rounded-2xl p-8 md:p-12 transition-all duration-300 hover:shadow-[0_0_40px_rgba(137,171,227,0.15)] hover:-translate-y-1 flex items-center justify-center">
                <Image src="/blueorigin.png" alt="Blue Origin" width={260} height={100} className="object-contain brightness-90 group-hover:brightness-110 transition-all duration-300" />
              </a>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/about" className="inline-block border border-[#89abe3]/40 text-[#89abe3] hover:bg-[#89abe3] hover:text-foreground font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-colors">
              Learn More About SASE
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
