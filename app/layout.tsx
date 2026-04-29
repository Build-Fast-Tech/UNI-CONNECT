import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://uniconnect.pk"),
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
    url: "https://uniconnect.pk",
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://uniconnect.pk/#website",
      url: "https://uniconnect.pk",
      name: "UniConnect",
      description: "Pakistan's all-in-one university student platform",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://uniconnect.pk/notes?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://uniconnect.pk/#organization",
      name: "UniConnect",
      url: "https://uniconnect.pk",
      logo: { "@type": "ImageObject", url: "https://uniconnect.pk/og-image.png" },
      sameAs: ["https://github.com/ruvnet/uniconnect"],
      description: "The all-in-one platform for Pakistani university students — notes, societies, study groups, jobs, and AI tutoring.",
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://uniconnect.pk/#edu",
      name: "UniConnect",
      description: "Connecting Pakistani university students through shared notes, societies, and collaborative study tools.",
      url: "https://uniconnect.pk",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="midnight"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
