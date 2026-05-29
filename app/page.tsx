"use client";

import { MarketingNav }        from "@/components/layout/MarketingNav";
import { Footer }              from "@/components/layout/Footer";
import { HeroSection }        from "@/components/landing/HeroSection";
import { UniversityTicker }   from "@/components/landing/UniversityTicker";
import { FeaturesSection }    from "@/components/landing/FeaturesSection";
import { StatsSection }       from "@/components/landing/StatsSection";
import { HowItWorks }         from "@/components/landing/HowItWorks";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection }         from "@/components/landing/FAQSection";
import { CTASection }         from "@/components/landing/CTASection";
import { NexusScene }         from "@/components/landing/nexus/NexusScene";
import { useSceneStore }      from "@/lib/scene-store";
import { useEffect }          from "react";
import "./landing.css";

export default function HomePage() {
  const setScrollProgress = useSceneStore((state) => state.setScrollProgress);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalHeight;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrollProgress]);

  return (
    <div className="landing-page relative">
      {/* 3D Cosmic Background */}
      <NexusScene />

      {/* Overlay content */}
      <div className="relative z-10">
        <MarketingNav />
        <main className="flex-1 relative">
          <HeroSection />
          <UniversityTicker />
          <FeaturesSection />
          <StatsSection />
          <HowItWorks />
          <TestimonialsSection />
          <FAQSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
