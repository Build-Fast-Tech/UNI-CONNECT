import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library — Notes & Study Materials",
  description:
    "Browse and download free study notes, past papers, sessional exams, and textbooks shared by Pakistani university students. CS, Math, Physics, Business, and more.",
  keywords: [
    "university notes pakistan", "study materials pakistan", "FAST notes",
    "NUST study materials", "LUMS notes", "past papers pakistan",
    "sessional papers", "student notes download", "university library pakistan",
  ],
  openGraph: {
    title: "UniConnect Library — Free Notes for Pakistani Students",
    description: "Download notes, past papers and textbooks shared by students across Pakistan.",
    type: "website",
  },
};

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "UniConnect Library",
            "description": "Free study notes, past papers and textbooks for Pakistani university students",
            "url": "https://uniconnect.pk/notes",
            "provider": {
              "@type": "Organization",
              "name": "UniConnect",
              "url": "https://uniconnect.pk",
            },
          }),
        }}
      />
      {children}
    </>
  );
}
