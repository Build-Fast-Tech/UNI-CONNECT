"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useCurrentUser } from "@/components/providers/UserProvider";
import { createClient } from "@/lib/supabase/client";


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
  { href: "/feed",         icon: Home,          label: "Home" },
  {
    href: "#",             icon: MessageSquare, label: "Communication", showBadge: true,
    children: [
      { href: "/chat",   icon: MessageSquare, label: "Channels" },
      { href: "/inbox",  icon: Inbox,         label: "Inbox (DMs)" },
    ],
  },
  {
    href: "#",             icon: Briefcase,     label: "Career Center",
    children: [
      { href: "/cvs/upload", icon: FileUser, label: "Upload CV" },
      { href: "/jobs", icon: Briefcase, label: "Jobs" },
    ],
  },
  { href: "/notes",        icon: BookOpen,      label: "Library" },
  { href: "/entry-test",  icon: ClipboardList, label: "Entry Test Prep", isNew: true },
  { href: "/study",        icon: Timer,         label: "Study Center" },
  {
    href: "#",             icon: BarChart3,     label: "GPA & Analytics",
    children: [
      { href: "/gpa",              icon: TrendingUp, label: "GPA Manager" },
      { href: "/study/analytics",  icon: BarChart3,  label: "Subject Mastery" },
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

interface SidebarProps { mobileOpen: boolean; onClose: () => void; unreadCount: number; markAllRead: () => void; }


function SidebarContent({
  isAdmin, isEmployer, isSocietyHead, isActive, onLinkClick, showCloseButton, onClose,
  unreadCount, markAllRead, fullName, initials, avatarUrl,
  pendingEmployers, pendingSocieties, pendingFeedback,
}: {
  isAdmin: boolean;
  isEmployer: boolean;
  isSocietyHead: boolean;
  isActive: (href: string, label: string) => boolean;
  onLinkClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  unreadCount: number;
  markAllRead: () => void;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  pendingEmployers: number;
  pendingSocieties: number;
  pendingFeedback: number;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (label: string) =>
    setExpanded(p => { const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n; });

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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-[rgb(var(--muted)/0.5)]">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{fullName || "Student"}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {isAdmin && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 leading-tight">Admin</span>
              )}
              {isEmployer && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 leading-tight">Employer</span>
              )}
              {isSocietyHead && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400 leading-tight">Society Head</span>
              )}
              {!isAdmin && !isEmployer && !isSocietyHead && (
                <span className="text-[11px] text-[rgb(var(--muted-fg))]">Student</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--muted-fg))]">Workspace</p>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto" data-lenis-prevent>
        {NAV_ITEMS.map(item => {
          /* ── Expandable item (Career Center) ── */
          if (item.children) {
            const isOpen = expanded.has(item.label);
            const childActive = item.children.some(c => isActive(c.href, c.label));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    childActive
                      ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                      : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.showBadge && unreadCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-60" />
                    : <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-60" />}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden pl-4 mt-0.5"
                    >
                      {item.children.map(child => {
                        const active = isActive(child.href, child.label);
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={onLinkClick}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                              active
                                ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                                : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                            )}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
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

          /* ── Regular nav item ── */
          const active = isActive(item.href, item.label);
          const badge = item.showBadge && unreadCount > 0 ? unreadCount : null;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => { if (item.showBadge) markAllRead(); onLinkClick?.(); }}
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
              {badge !== null && badge > 0 && (
                <span className="relative z-10 w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
              )}
              {item.isNew && !badge && (
                <span className="relative z-10 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase flex-shrink-0">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-2 pt-2 border-t border-[rgb(var(--border))] mt-1 space-y-0.5">
        {isAdmin && (
          <>
            <p className="px-4 mb-1 mt-2 text-[10px] font-semibold uppercase tracking-widest text-[rgb(var(--muted-fg))]">Admin Panel</p>
            <Link
              href="/admin/employers"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive("/admin/employers", "Admin Employers")
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              Employers
              {pendingEmployers > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {pendingEmployers > 9 ? "9+" : pendingEmployers}
                </span>
              )}
            </Link>
            <Link
              href="/admin/societies"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive("/admin/societies", "Admin Societies")
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <Building className="w-5 h-5 flex-shrink-0" />
              Societies
              {pendingSocieties > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {pendingSocieties > 9 ? "9+" : pendingSocieties}
                </span>
              )}
            </Link>
            <Link
              href="/admin/feedback"
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive("/admin/feedback", "Admin Feedback")
                  ? "bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              )}
            >
              <MessageSquarePlus className="w-5 h-5 flex-shrink-0" />
              Feedback
              {pendingFeedback > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {pendingFeedback > 9 ? "9+" : pendingFeedback}
                </span>
              )}
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

export function Sidebar({ mobileOpen, onClose, unreadCount, markAllRead }: SidebarProps) {
  const pathname = usePathname();
  const { role, userId, fullName, initials, avatarUrl } = useCurrentUser();
  const isAdmin = role === "admin";
  const supabase = useMemo(() => createClient(), []);

  // Check if user has employer badge (role is employer, or they've posted jobs)
  const [isEmployer, setIsEmployer] = useState(role === "employer");
  // Check if user is a society head
  const [isSocietyHead, setIsSocietyHead] = useState(false);
  useEffect(() => {
    if (!userId) return;
    supabase.from("societies").select("id").eq("admin_id", userId).eq("status", "approved").limit(1)
      .then(({ data }) => setIsSocietyHead((data?.length ?? 0) > 0));
    // Check if user has posted any jobs (employer badge)
    (supabase as any).from("jobs").select("id", { count: "exact", head: true }).eq("employer_id", userId)
      .then(({ count }: any) => { if ((count ?? 0) > 0) setIsEmployer(true); });
  }, [userId, supabase]);

  // Admin: fetch pending counts with real-time subscriptions
  const [pendingEmployers, setPendingEmployers] = useState(0);
  const [pendingSocieties, setPendingSocieties] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState(0);
  useEffect(() => {
    if (!isAdmin) return;

    const fetchEmployers = () => {
      (supabase as any).from("employer_applications").select("id", { count: "exact", head: true }).eq("status", "pending")
        .then(({ count }: any) => setPendingEmployers(count ?? 0));
    };

    const fetchSocieties = () => {
      (supabase as any).from("societies").select("id", { count: "exact", head: true }).eq("status", "pending")
        .then(({ count }: any) => setPendingSocieties(count ?? 0));
    };

    const fetchFeedback = () => {
      (supabase as any).from("feedback").select("id", { count: "exact", head: true }).eq("status", "pending")
        .then(({ count }: any) => setPendingFeedback(count ?? 0));
    };

    // Initial fetch
    fetchEmployers();
    fetchSocieties();
    fetchFeedback();

    // Real-time subscriptions
    const empChan = supabase
      .channel("sidebar-pending-employers")
      .on("postgres_changes", { event: "*", schema: "public", table: "employer_applications" }, () => {
        fetchEmployers();
      })
      .subscribe();

    const socChan = supabase
      .channel("sidebar-pending-societies")
      .on("postgres_changes", { event: "*", schema: "public", table: "societies" }, () => {
        fetchSocieties();
      })
      .subscribe();

    const fbChan = supabase
      .channel("sidebar-pending-feedback")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => {
        fetchFeedback();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(empChan);
      supabase.removeChannel(socChan);
      supabase.removeChannel(fbChan);
    };
  }, [isAdmin, supabase]);

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

  const shared = {
    isAdmin, isEmployer, isSocietyHead, isActive, unreadCount, markAllRead,
    fullName, initials, avatarUrl, pendingEmployers, pendingSocieties, pendingFeedback,
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] py-4">
        <SidebarContent {...shared} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
            <motion.aside
              className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden flex flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] py-4"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <SidebarContent {...shared} onLinkClick={onClose} showCloseButton onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
