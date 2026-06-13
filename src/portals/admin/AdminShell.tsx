import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { AdminChatSoundListener } from "@/features/support/components/AdminChatSoundListener";
import { AdminAssistantProvider } from "@/features/assistant/components/AdminAssistantProvider";
import { Topbar } from "./Topbar";
import { ADMIN_NAV } from "./adminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAssistantProvider>
      <PortalShellLayout
        nav={ADMIN_NAV}
        subtitle="Administrateur"
        headerSlot={<AdminChatSoundListener />}
        topbar={(props) => <Topbar {...props} />}
      >
        {children}
      </PortalShellLayout>
    </AdminAssistantProvider>
  );
}
