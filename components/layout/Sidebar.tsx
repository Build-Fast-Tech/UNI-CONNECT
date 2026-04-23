"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, FileText, Briefcase,
  FileUser, Bot, User, Inbox, GraduationCap, Settings,
  MessageSquarePlus, Info, ShieldCheck, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/feed",          icon: LayoutDashboard, label: "Feed" },
  { href: "/universities",  icon: GraduationCap,   label: "Universities" },
  { href: "/chat",          icon: MessageSquare,   label: "Chat" },
  { href: "/notes",         icon: FileText,        label: "Notes" },
  { href: "/jobs",          icon: Briefcase,       label: "Jobs" },
  { href: "/cvs",           icon: FileUser,        label: "CVs" },
  { href: "/ai",            icon: Bot,             label: "AI" },
  { href: "/inbox",         icon: Inbox,           label: "Inbox" },
];

const BOTTOM_ITEMS = [
  { href: "/profile",           icon: User,               label: "Profile" },
  { href: "/feedback",          icon: MessageSquarePlus,  label: "Feedback" },
  { href: "/about",             icon: Info,               label: "About" },
  { href: "/profile/settings",  icon: Settings,           label: "Settings" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function SidebarContent({
  isAdmin,
  isActive,
  onLinkClick,
  showCloseButton,
  onClose,
}: {
  isAdmin: boolean;
  isActive: (href: string) => boolean;
  onLinkClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="px-4 mb-8 flex items-center justify-between">
        <Link href="/" onClick={onLinkClick} className="flex items-center gap-2 group">
          <span className="font-bold text-xl tracking-tight">
            Uni<span className="text-[rgb(var(--primary))]">Connect</span>
          </span>
        </Link>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                active
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-[rgb(var(--primary)/0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 flex-shrink-0 relative z-10", active && "text-[rgb(var(--primary))]")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pt-2 border-t border-[rgb(var(--border))] space-y-0.5 mt-2">
        {isAdmin && (
          <Link
            href="/admin/employers"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive("/admin")
                ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            )}
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            Admin
          </Link>
        )}
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
        setIsAdmin(data?.role === "admin");
      });
    });
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/feed" && pathname.startsWith(href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] py-4">
        <SidebarContent isAdmin={isAdmin} isActive={isActive} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.aside
              className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden flex flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] py-4"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <SidebarContent
                isAdmin={isAdmin}
                isActive={isActive}
                onLinkClick={onClose}
                showCloseButton
                onClose={onClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
