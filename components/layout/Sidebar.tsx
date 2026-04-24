"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, MessageSquare, Briefcase,
  BookOpen, Bot, Users, CalendarDays,
  Settings, X, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { useInboxNotifications } from "@/lib/hooks/useInboxNotifications";

const NAV_ITEMS = [
  { href: "/feed",         icon: Home,          label: "Home",           showBadge: false, isNew: false },
  { href: "/chat",         icon: MessageSquare, label: "Communication",  showBadge: true,  isNew: false },
  { href: "/jobs",         icon: Briefcase,     label: "Career Center",  showBadge: false, isNew: false },
  { href: "/notes",        icon: BookOpen,      label: "Library",        showBadge: false, isNew: false },
  { href: "/ai",           icon: Bot,           label: "UniAI Tutor",    showBadge: false, isNew: true  },
  { href: "/universities", icon: Users,         label: "Clubs & Events", showBadge: false, isNew: false },
  { href: "/feed",         icon: CalendarDays,  label: "Calendar",       showBadge: false, isNew: false },
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
  unreadCount,
  fullName,
  initials,
  avatarUrl,
}: {
  isAdmin: boolean;
  isActive: (href: string, label: string) => boolean;
  onLinkClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  unreadCount: number;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <Link href="/" onClick={onLinkClick} className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">
            Uni<span className="text-[rgb(var(--primary))]">Connect</span>
          </span>
        </Link>
        {showCloseButton && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2.5 px-1 py-2 rounded-xl bg-[rgb(var(--muted)/0.5)]">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{fullName || "Student"}</p>
            <p className="text-[11px] text-[rgb(var(--muted-fg))]">Student</p>
          </div>
        </div>
      </div>

      {/* Workspace label */}
      <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--muted-fg))]">Workspace</p>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.label);
          const badge = item.showBadge && unreadCount > 0 ? unreadCount : null;
          return (
            <Link
              key={item.label}
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
              <span className="relative z-10 flex-1">{item.label}</span>
              {badge !== null && (
                <span className="relative z-10 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {item.isNew && !badge && (
                <span className="relative z-10 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wide flex-shrink-0">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* My Universities */}
      <div className="px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--muted-fg))]">My Universities</p>
        <Link
          href="/universities"
          onClick={onLinkClick}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors group"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-sm text-[rgb(var(--muted-fg))] group-hover:text-[rgb(var(--fg))] truncate transition-colors">My University</span>
        </Link>
      </div>

      {/* Bottom */}
      <div className="px-2 pt-2 border-t border-[rgb(var(--border))] mt-1 space-y-0.5">
        {isAdmin && (
          <Link
            href="/admin/employers"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive("/admin", "Admin")
                ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            )}
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            Admin
          </Link>
        )}
        <Link
          href="/profile/settings"
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            isActive("/profile/settings", "Settings")
              ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
              : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          Settings
        </Link>
      </div>
    </>
  );
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role, userId, fullName, initials, avatarUrl } = useCurrentUser();
  const isAdmin = role === "admin";
  const { unreadCount } = useInboxNotifications(userId);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const isActive = (href: string, label: string) => {
    if (label === "Calendar") return pathname === "/calendar";
    return pathname === href || (href !== "/feed" && pathname.startsWith(href));
  };

  const sharedProps = { isAdmin, isActive, unreadCount, fullName, initials, avatarUrl };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] py-4">
        <SidebarContent {...sharedProps} />
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
              <SidebarContent {...sharedProps} onLinkClick={onClose} showCloseButton onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
