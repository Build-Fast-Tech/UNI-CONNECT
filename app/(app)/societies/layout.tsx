import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Societies",
  description:
    "Browse, join, and follow university societies across Pakistan. Find academic, cultural, sports, tech, arts, and community clubs at your university.",
  openGraph: {
    title: "Societies | UniConnect",
    description:
      "Browse university societies in Pakistan — academic, cultural, sports, tech, arts, and community clubs.",
  },
};

export default function SocietiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
