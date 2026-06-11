import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { Topbar } from "./Topbar";
import { ADMIN_NAV } from "./adminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellLayout
      nav={ADMIN_NAV}
      subtitle="Administrateur"
      topbar={(props) => <Topbar {...props} />}
    >
      {children}
    </PortalShellLayout>
  );
}
