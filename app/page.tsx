"use client";

import Link from "next/link";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Briefcase, HandHeart, HeartHandshake } from "lucide-react";

export default function Home() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 1000,
    });
  }, []);

  return (
    <main className="sase-home">
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

    </main>
  );
}
