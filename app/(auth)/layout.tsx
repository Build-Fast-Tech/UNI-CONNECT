import Link from "next/link";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "rgb(var(--bg))" }}>
      {/* Minimal header */}
      <header className="h-16 flex items-center justify-between px-6">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Uni<span className="text-[rgb(var(--primary))]">Connect</span>
        </Link>
        <ThemeSwitcher />
      </header>

      {/* Auth form centered */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-center text-xs text-[rgb(var(--muted-fg))]">
        © 2026 UniConnect · Made with care in Pakistan 🇵🇰
      </footer>
    </div>
  );
}
