import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

// Canonical site URL. Set NEXT_PUBLIC_SITE_URL in Vercel (to the live domain or
// a custom domain). Falls back to the live deployment — never the unconfigured
// uniconnect.pk, which previously poisoned canonical/OG/JSON-LD for Google.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://uni-connect-official.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "UniConnect — Pakistan's University Student Platform",
    template: "%s | UniConnect",
  },
  description:
    "The all-in-one platform for Pakistani university students — notes, societies, study groups, jobs, and AI tutoring.",
  keywords: [
    "university", "Pakistan", "students", "NUST", "LUMS", "FAST", "IBA",
    "notes", "jobs", "chat", "societies", "study groups", "AI tutor",
  ],
  authors: [{ name: "UniConnect" }],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: SITE,
    siteName: "UniConnect",
    title: "UniConnect — Pakistan's University Student Platform",
    description: "Notes, societies, study groups, jobs, and AI tutoring for Pakistani university students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniConnect — Pakistan's University Student Platform",
    description: "Notes, societies, study groups, jobs, and AI tutoring for Pakistani university students.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "ciGVfXF_u8EEtqWTxrIg770n8QvvvdJPbhy1TLpFSxc",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "UniConnect",
      description: "Pakistan's all-in-one university student platform",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/notes?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "UniConnect",
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/og-image.png` },
      description: "The all-in-one platform for Pakistani university students — notes, societies, study groups, jobs, and AI tutoring.",
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE}/#edu`,
      name: "UniConnect",
      description: "Connecting Pakistani university students through shared notes, societies, and collaborative study tools.",
      url: SITE,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: use the comprehensive `@graph` JSON-LD defined at module scope above.
  // A second local definition previously shadowed it and shipped weaker SEO data.
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mxlfreenahsqdclabemx.supabase.co"} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mxlfreenahsqdclabemx.supabase.co"} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
