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
import { LiquidBackground, WaveDivider } from "@/components/landing/LiquidBackground";

export default function HomePage() {
  return (
    <>
      <LiquidBackground intensity="medium" />
      <MarketingNav />
      <main className="flex-1 relative">
        <HeroSection />
        <WaveDivider />
        <UniversityTicker />
        <FeaturesSection />
        <WaveDivider flip />
        <StatsSection />
        <HowItWorks />
        <WaveDivider />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
