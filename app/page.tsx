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

export default function HomePage() {
  return (
    <>
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
    </>
  );
}
