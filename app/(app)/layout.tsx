import { AppShell } from "@/components/layout/AppShell";
import { PermissionsModal } from "@/components/PermissionsModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <PermissionsModal />
    </AppShell>
  );
}
