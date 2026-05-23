"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProvider } from "@/components/providers/UserProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UsernameSetupModal } from "@/components/ui/UsernameSetupModal";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { useInboxNotifications } from "@/lib/hooks/useInboxNotifications";
import { LayoutErrorBoundary } from "./LayoutErrorBoundary";
import { createClient } from "@/lib/supabase/client";

/**
 * OnboardingGuard — queries the DB directly to check onboarding status.
 *
 * Uses its own DB query rather than UserProvider state so that:
 * - It never fires before the profile has actually loaded
 * - A network error on the profile fetch does NOT cause a false redirect
 * - The role check uses real DB data, not the "student" default
 *
 * `hasRedirected` ref prevents duplicate calls if the component re-renders
 * before the navigation completes.
 */
function OnboardingGuard() {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("university_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) return; // DB / network error — don't redirect, stay safe

      const role = data?.role ?? "student";
      if (role !== "student") return; // Employers / admins skip onboarding

      if (!data?.university_id) {
        hasRedirected.current = true;
        router.replace("/onboarding");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * AppShellInner — the authenticated app shell.
 *
 * KEY FIX: useInboxNotifications is called ONCE here and its values are
 * passed as props to both Sidebar and Topbar. Previously both components
 * called the hook independently, creating two Supabase Realtime channel
 * subscriptions with the same name ("inbox-notifications-{userId}").
 * When a message arrived, both handlers fired setUnreadCount on their
 * own separate React state at the same time — while the other component
 * was mid-render — triggering React error #310.
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { userId, username, loaded } = useCurrentUser();
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);

  // Single source of truth for inbox badge — passed to both Sidebar and Topbar
  const { unreadCount, markAllRead } = useInboxNotifications(userId);

  const hasUsername = !!username || !!sessionUsername;
  const showModal = loaded && !!userId && !hasUsername;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Last-resort safety net: redirect students who skipped onboarding */}
      {loaded && <OnboardingGuard />}

      <LayoutErrorBoundary>
        <Sidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          unreadCount={unreadCount}
          markAllRead={markAllRead}
        />
      </LayoutErrorBoundary>

      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${showModal ? "pointer-events-none select-none" : ""}`}>
        <LayoutErrorBoundary>
          <Topbar
            onMenuClick={() => setMobileNavOpen(true)}
            unreadCount={unreadCount}
            markAllRead={markAllRead}
          />
        </LayoutErrorBoundary>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6" data-lenis-prevent>
          {children}
        </main>
      </div>

      {showModal && (
        <UsernameSetupModal
          userId={userId}
          onDone={(u) => setSessionUsername(u)}
        />
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AppShellInner>{children}</AppShellInner>
    </UserProvider>
  );
}
