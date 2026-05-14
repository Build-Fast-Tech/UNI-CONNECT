import type { Metadata } from "next";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "UniConnect",
  url: "https://uniconnect.pk",
  description: "Pakistan's all-in-one university student platform",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://uniconnect.pk/notes?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  title: "UniConnect — Pakistan's University Student Platform",
  description:
    "The all-in-one platform for Pakistani university students — notes, societies, study groups, jobs, and AI tutoring.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
