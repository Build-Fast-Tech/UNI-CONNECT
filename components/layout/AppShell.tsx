"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProvider } from "@/components/providers/UserProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UsernameSetupModal } from "@/components/ui/UsernameSetupModal";
import { useCurrentUser } from "@/components/providers/UserProvider";
import { LayoutErrorBoundary } from "./LayoutErrorBoundary";

/**
 * OnboardingGuard — runs inside AppShell (after UserProvider has loaded the profile).
 *
 * This is the last-resort safety net for the auth routing:
 *   - The /auth/callback route checks university_id server-side and should route new
 *     users to /onboarding. But if anything goes wrong (caching, PKCE race, etc.),
 *     a student with no university_id who lands on an app route will be silently
 *     redirected here before they see any protected content.
 *   - Employers (role !== "student") never get redirected.
 *   - Only fires once the profile is fully loaded (loaded === true), so there is no
 *     false-positive during the initial render when universityId is still null.
 */
function OnboardingGuard() {
  const { userId, universityId, loaded, role } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loaded) return;           // wait for profile fetch to complete
    if (!userId) return;           // unauthenticated — middleware handles this
    if (role !== "student") return; // employers / admins don't need onboarding
    if (!universityId) {
      // Student has no university set → they haven't completed onboarding
      router.replace("/onboarding");
    }
  }, [loaded, userId, universityId, role, router]);

  return null;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { userId, username, loaded } = useCurrentUser();
  // Track username set during this session (before UserProvider re-fetches)
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);

  const hasUsername = !!username || !!sessionUsername;
  const showModal = loaded && !!userId && !hasUsername;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Guard: silently redirect students who skipped onboarding */}
      <OnboardingGuard />

      {/* Wrap Sidebar in its own boundary — crashes here don't kill the page */}
      <LayoutErrorBoundary>
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      </LayoutErrorBoundary>

      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${showModal ? "pointer-events-none select-none" : ""}`}>
        {/* Wrap Topbar in its own boundary */}
        <LayoutErrorBoundary>
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
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
