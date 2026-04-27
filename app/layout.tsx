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
  title: {
    default: "UniConnect — Pakistan's University Student Platform",
    template: "%s | UniConnect",
  },
  description:
    "The platform built for Pakistan's university students. Notes, chats, jobs, and an AI study partner — all in one place.",
  keywords: ["university", "pakistan", "students", "NUST", "LUMS", "FAST", "notes", "jobs", "chat"],
  authors: [{ name: "UniConnect" }],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://uniconnect.pk",
    siteName: "UniConnect",
    title: "UniConnect — Pakistan's University Student Platform",
    description: "Notes, chats, jobs, and an AI study partner for Pakistani university students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniConnect",
    description: "Pakistan's University Student Super-Platform",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "UniConnect",
    "url": "https://uniconnect.pk",
    "description": "The super-platform for Pakistani university students. Notes, chats, and AI partner.",
    "applicationCategory": "EducationApplication",
    "operatingSystem": "Web",
    "author": {
      "@type": "Organization",
      "name": "UniConnect"
    }
  };

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
