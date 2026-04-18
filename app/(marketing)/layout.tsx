import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
