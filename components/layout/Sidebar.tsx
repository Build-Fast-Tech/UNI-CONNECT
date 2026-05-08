"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, MessageSquare, Briefcase, BookOpen, Bot, Users,
  CalendarDays, GraduationCap, FileUser, ChevronDown, ChevronRight,
  Settings, X, ShieldCheck, User, MessageSquarePlus, Info,
  Timer, BarChart3, TrendingUp, Building, Inbox, Code2, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { useInboxNotifications } from "@/lib/hooks/useInboxNotifications";

interface NavChild { href: string; icon: React.ElementType; label: string; }
interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  showBadge?: boolean;
  isNew?: boolean;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/feed", icon: Home, label: "Home" },
  {
    href: "#", icon: MessageSquare, label: "Communication", showBadge: true,
    children: [
      { href: "/chat",  icon: MessageSquare, label: "Channels" },
      { href: "/inbox", icon: Inbox,         label: "Inbox" },
    ],
  },
  {
    href: "#", icon: Briefcase, label: "Career Center",
    children: [
      { href: "/cvs/upload", icon: FileUser,  label: "Upload CV" },
      { href: "/jobs",        icon: Briefcase, label: "Jobs" },
    ],
  },
  { href: "/notes",       icon: BookOpen,      label: "Library" },
  { href: "/entry-test",  icon: ClipboardList, label: "Entry-test prep", isNew: true },
  { href: "/study",       icon: Timer,         label: "Study Center" },
  {
    href: "#", icon: BarChart3, label: "Analytics",
    children: [
      { href: "/gpa",             icon: TrendingUp, label: "GPA Manager" },
      { href: "/study/analytics", icon: BarChart3,  label: "Subject Mastery" },
    ],
  },
  { href: "/coding",       icon: Code2,         label: "Coding OS",   isNew: true },
  { href: "/ai",           icon: Bot,           label: "UniAI Tutor", isNew: true },
  { href: "/universities", icon: GraduationCap, label: "Universities" },
  { href: "/clubs",        icon: Users,         label: "Clubs & Events" },
  { href: "/calendar",     icon: CalendarDays,  label: "Calendar" },
];

const BOTTOM_ITEMS = [
  { href: "/profile",          icon: User,              label: "Profile" },
  { href: "/feedback",         icon: MessageSquarePlus, label: "Feedback" },
  { href: "/about",            icon: Info,              label: "About" },
  { href: "/profile/settings", icon: Settings,          label: "Settings" },
];

interface SidebarProps { mobileOpen: boolean; onClose: () => void; }

function SidebarContent({
  isAdmin, isActive, onLinkClick, showCloseButton, onClose,
  unreadCount, markAllRead, fullName, initials, avatarUrl,
}: {
  isAdmin: boolean;
  isActive: (href: string, label: string) => boolean;
  onLinkClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  unreadCount: number;
  markAllRead: () => void;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (label: string) =>
    setExpanded(p => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n; });

  return (
    <>
      {/* Logomark */}
      <div className="px-5 pt-1 pb-5 flex items-center justify-between">
        <Link href="/" onClick={onLinkClick} className="flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-[14px] font-display">
            U
            <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-[rgb(var(--accent))] border-2 border-[rgb(var(--bg))]" />
          </span>
          <span className="font-display text-[20px] leading-none mt-0.5 text-[rgb(var(--fg))]">UniConnect</span>
        </Link>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[rgb(var(--bg-sunk))] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="px-3 mb-5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-[rgb(var(--bg-sunk))] border border-[rgb(var(--line))]">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[rgb(var(--primary)/0.14)] text-[rgb(var(--primary))] flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight tracking-tight text-[rgb(var(--fg))] truncate">
              {fullName || "Student"}
            </p>
            <p className="text-[11px] text-[rgb(var(--fg-3))] font-mono tracking-tight">Student account</p>
          </div>
        </div>
      </div>

      <p className="eyebrow px-5 mb-2.5">Workspace</p>

      <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          if (item.children) {
            const isOpen = expanded.has(item.label);
            const childActive = item.children.some(c => isActive(c.href, c.label));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                    childActive
                      ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                      : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.7} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.showBadge && unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[rgb(var(--destructive))] flex-shrink-0" />
                  )}
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 0.68, 0.32, 1] }}
                      className="overflow-hidden ml-3 pl-3 border-l border-[rgb(var(--line))]"
                    >
                      {item.children.map(child => {
                        const active = isActive(child.href, child.label);
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={onLinkClick}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 my-0.5 rounded-lg text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                              active
                                ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                                : "text-[rgb(var(--fg-3))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
                            )}
                          >
                            <child.icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.7} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const active = isActive(item.href, item.label);
          const showDot = item.showBadge && unreadCount > 0;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => { if (item.showBadge) markAllRead(); onLinkClick?.(); }}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                active
                  ? "text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
              )}
            >
              {active && (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-[rgb(var(--primary)/0.10)]"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                />
              )}
              <item.icon className="w-[18px] h-[18px] flex-shrink-0 relative" strokeWidth={1.7} />
              <span className="relative flex-1">{item.label}</span>
              {showDot && (
                <span className="relative w-2 h-2 rounded-full bg-[rgb(var(--destructive))] flex-shrink-0" />
              )}
              {item.isNew && !showDot && (
                <Pill tone="primary" size="xs" shape="square" className="relative">NEW</Pill>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom group */}
      <div className="mx-2.5 mt-2 pt-3 border-t border-[rgb(var(--line))] space-y-0.5">
        {isAdmin && (
          <>
            <Link
              href="/admin/employers"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                isActive("/admin/employers", "Admin Employers")
                  ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <ShieldCheck className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.7} />
              Employers
            </Link>
            <Link
              href="/admin/societies"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                isActive("/admin/societies", "Admin Societies")
                  ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Building className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.7} />
              Societies
            </Link>
            <Link
              href="/admin/feedback"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                isActive("/admin/feedback", "Admin Feedback")
                  ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <MessageSquarePlus className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.7} />
              Feedback
            </Link>
          </>
        )}
        {BOTTOM_ITEMS.map(item => {
          const active = isActive(item.href, item.label);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-[var(--dur-quick)]",
                active
                  ? "bg-[rgb(var(--primary)/0.10)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg-2))] hover:bg-[rgb(var(--bg-sunk))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.7} />
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
  const { role, userId, fullName, initials, avatarUrl } = useCurrentUser();
  const isAdmin = role === "admin";
  const { unreadCount, markAllRead } = useInboxNotifications(userId);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const isActive = (href: string, label: string) => {
    if (label === "Calendar") return pathname === "/calendar";
    if (label === "Clubs & Events") return pathname.startsWith("/clubs");
    if (href === "#") return false;
    return pathname === href || (href !== "/feed" && pathname.startsWith(href));
  };

  const shared = { isAdmin, isActive, unreadCount, markAllRead, fullName, initials, avatarUrl };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[260px] h-screen sticky top-0 border-r border-[rgb(var(--line))] bg-[rgb(var(--bg))] py-5">
        <SidebarContent {...shared} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-[rgb(var(--fg)/0.40)] z-40 lg:hidden backdrop-blur-sm"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.aside
              className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden flex flex-col border-r border-[rgb(var(--line))] bg-[rgb(var(--bg))] py-5"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <SidebarContent {...shared} onLinkClick={onClose} showCloseButton onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
