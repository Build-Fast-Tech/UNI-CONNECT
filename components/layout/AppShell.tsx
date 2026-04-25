"use client";

import { useState } from "react";
import { UserProvider } from "@/components/providers/UserProvider";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UsernameSetupModal } from "@/components/ui/UsernameSetupModal";
import { useCurrentUser } from "@/components/providers/UserProvider";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { userId, username, loaded } = useCurrentUser();
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null);

  const showModal = loaded && !!userId && !username && !resolvedUsername;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
      {showModal && (
        <UsernameSetupModal
          userId={userId}
          onDone={(u) => setResolvedUsername(u)}
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
