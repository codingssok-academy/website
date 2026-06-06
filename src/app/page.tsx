"use client";


import SmoothScroll from "@/components/effects/SmoothScroll";
import ScrollProgress from "@/components/effects/ScrollProgress";
import PageLoader from "@/components/effects/PageLoader";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import LivePulseSection from "@/components/sections/LivePulseSection";
import TechMarquee from "@/components/sections/TechMarquee";
import WhyUs from "@/components/sections/WhyUs";
import Philosophy from "@/components/sections/Philosophy";
import PromoShowcase from "@/components/sections/PromoShowcase";
import Teachers from "@/components/sections/Teachers";
import Curriculum from "@/components/sections/Curriculum";
import Schedule from "@/components/sections/Schedule";
import Gallery from "@/components/sections/Gallery";
import Events from "@/components/sections/Events";
import Awards from "@/components/sections/Awards";
import Achievements from "@/components/sections/Achievements";
import SocialFeed from "@/components/sections/SocialFeed";
import PlatformShowcase from "@/components/sections/PlatformShowcase";
import LiveStudySection from "@/components/sections/LiveStudySection";
import Reviews from "@/components/sections/Reviews";
import LeaderboardSection from "@/components/sections/LeaderboardSection";
import Testimonials from "@/components/sections/Testimonials";

import Pricing from "@/components/sections/Pricing";
import FAQ from "@/components/sections/FAQ";
import Contact from "@/components/sections/Contact";


export default function Home() {
  return (
    <SmoothScroll>
      <>
        <PageLoader />
        <ScrollProgress />
        <main>
          {/* Content wrapper — sits above footer for reveal effect */}
          <div className="relative z-10 bg-white">
            <Navbar />
            {/* Hero + LivePulseSection: 블로그 실데이터 + 실시간 학습 카운터 */}
            <Hero />
            <LivePulseSection />
            <TechMarquee />
            <WhyUs />
            <Philosophy />
            <PromoShowcase />
            <PlatformShowcase />
            <LiveStudySection />
            <Teachers />
            <Curriculum />
            <Schedule />
            <Gallery />
            <Events />
            <Awards />
            <Achievements />
            <SocialFeed />
            <Reviews />
            <LeaderboardSection />
            <Testimonials />

            <Pricing />
            <FAQ />
            <Contact />
          </div>

        </main>

      </>
    </SmoothScroll>
  );
}
