import Link from "next/link";
import Image from "next/image";
import { Briefcase, HandHeart, HeartHandshake } from "lucide-react";
import Leaderboard from "@/components/Leaderboard";
import AosInit from "@/components/AosInit";

export default function Home() {
  return (
    <main className="sase-home">
      <AosInit />
      {/* Hero Section */}
      <div className="sase-sun" aria-hidden="true" />
      <div className="sase-cloud sase-cloud-top" aria-hidden="true" />
      <div className="sase-cloud sase-cloud-middle" aria-hidden="true" />

      <section className="sase-hero relative z-10 flex flex-col justify-center">
        <div className="sase-hero-copy pt-[10vh]" data-aos="fade-up">
          <p className="sase-eyebrow">University of Central Florida</p>
          <h1>Build your<br /><span>future together.</span></h1>
          <p className="sase-intro">
            Connect with a community of Asian scientists and engineers through
            events, opportunities, and shared momentum.
          </p>
          <div className="sase-actions">
            <Link href="/forms" className="sase-primary-button">Explore forms</Link>
            <Link href="/events" className="sase-secondary-button border-[#89abe3] hover:border-[#dbc8b6] hover:text-[#dbc8b6]">See events <span aria-hidden="true">-&gt;</span></Link>
          </div>
        </div>
      </section>

      {/* Decorative Waves */}
      <div className="sase-wave sase-wave-back" aria-hidden="true" />
      <div className="sase-wave sase-wave-front" aria-hidden="true" />

      {/* About Section */}
      <section id="about" className="relative z-10 bg-[#f6f8fc] text-[#141b4d] py-24 px-6 md:px-12 mt-32">
        <div className="max-w-4xl mx-auto text-center space-y-8" data-aos="fade-up">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Welcome to the UCF <span className="text-[#89abe3]">SASE</span> Website
          </h2>
          <p className="text-lg md:text-xl text-[#64708c] leading-relaxed">
            Since its founding in 2007, the Society of Asian Scientists and Engineers (SASE) has grown to a nationally recognized organization with 20,000 members worldwide, striving to help Asian heritage scientific and engineering professionals achieve their full potential. The University of Central Florida SASE Chapter was founded in 2020, shortly before the pandemic. With only 4 years under our belt, we have made tremendous strides towards the development of our members centered around core values of career, diversity, and service. Our events and programs not only advance professional pursuits, but also foster a supportive community that celebrates each and every member’s story.
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="relative z-10 bg-[#f6f8fc] text-[#141b4d] pb-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-center text-[#89abe3] font-black text-4xl mb-16 tracking-tight" data-aos="fade-up">
            3 Core Values
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-aos="fade-up" data-aos-delay="200">
            {/* Value 1 */}
            <div className="bg-white rounded-2xl p-8 border border-[#cbd5e8] shadow-[0_12px_30px_rgba(23,29,82,0.06)] hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
              <div className="bg-[#e9eef8] text-[#89abe3] p-4 rounded-full mb-6">
                <Briefcase className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold mb-4">Professional Development</h4>
              <p className="text-[#64708c] leading-relaxed">
                We encourage members to leverage the experiences, knowledge, and skills gained through our organization to pursue their goals and aspirations.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white rounded-2xl p-8 border border-[#cbd5e8] shadow-[0_12px_30px_rgba(23,29,82,0.06)] hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
              <div className="bg-[#e9eef8] text-[#89abe3] p-4 rounded-full mb-6">
                <HandHeart className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold mb-4">Service</h4>
              <p className="text-[#64708c] leading-relaxed">
                We commit ourselves to promoting service opportunities that enable our members to give back to the community and make a meaningful impact.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white rounded-2xl p-8 border border-[#cbd5e8] shadow-[0_12px_30px_rgba(23,29,82,0.06)] hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center">
              <div className="bg-[#e9eef8] text-[#89abe3] p-4 rounded-full mb-6">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold mb-4">Diversity</h4>
              <p className="text-[#64708c] leading-relaxed">
                We aim to empower our members by showcasing how their diverse backgrounds can broaden perspectives and inspire collaborative efforts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="relative z-10 bg-[#f6f8fc] pb-24 px-6 md:px-12">
        <Leaderboard />
      </section>

      {/* Sponsors Section */}
      <section className="relative z-10 bg-[#141b4d] py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[0.65rem] font-black tracking-[0.2em] uppercase text-[#89abe3] bg-[#89abe3]/10 px-3 py-1 rounded-full mb-3">
              Thank You
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#e9e8e8] tracking-tight">Our Sponsors</h2>
            <p className="mt-3 text-[#89abe3] max-w-xl mx-auto text-sm leading-relaxed">
              UCF SASE is made possible by the generous support of our sponsors. Interested in partnering with us?
              Reach out to our External VP at{" "}
              <a href="mailto:ucfsase.evp@gmail.com" className="underline hover:text-[#dbc8b6] transition-colors">ucfsase.evp@gmail.com</a>.
            </p>
          </div>

          {/* Platinum */}
          <div className="mb-10">
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#fbbf24]/50" />
              <span className="flex items-center gap-2 text-xs font-black tracking-[0.15em] uppercase text-[#fbbf24]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                Platinum Sponsor
              </span>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#fbbf24]/50" />
            </div>
            <div className="flex justify-center">
              <a href="https://www.blueorigin.com" target="_blank" rel="noopener noreferrer"
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#89abe3]/50 rounded-2xl p-8 md:p-12 transition-all duration-300 hover:shadow-[0_0_40px_rgba(137,171,227,0.15)] hover:-translate-y-1 flex items-center justify-center">
                <Image src="/blueorigin.png" alt="Blue Origin" width={260} height={100} className="object-contain brightness-90 group-hover:brightness-110 transition-all duration-300" />
              </a>
            </div>
          </div>

          {/* Gold */}
          <div>
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#d4af37]/50" />
              <span className="flex items-center gap-2 text-xs font-black tracking-[0.15em] uppercase text-[#d4af37]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l3.057-3L12 3.5 15.943 0 19 3l-3 7H8L5 3zm-1 8h16l-2 13H6L4 11z"/></svg>
                Gold Sponsor
              </span>
              <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#d4af37]/50" />
            </div>
            <div className="flex justify-center">
              <a href="https://patelconservatory.org" target="_blank" rel="noopener noreferrer"
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#d4af37]/50 rounded-2xl p-8 md:p-12 transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] hover:-translate-y-1 flex items-center justify-center">
                <Image src="/patel.png" alt="Patel Conservatory" width={220} height={100} className="object-contain brightness-90 group-hover:brightness-110 transition-all duration-300" />
              </a>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/about" className="inline-block border border-[#89abe3]/40 text-[#89abe3] hover:bg-[#89abe3] hover:text-[#141b4d] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-colors">
              Learn More About SASE
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
