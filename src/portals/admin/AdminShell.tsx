import { PortalSidebar } from "@/portals/shared/PortalSidebar";
import { Topbar } from "./Topbar";
import { ADMIN_NAV } from "./adminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <PortalSidebar nav={ADMIN_NAV} subtitle="Administrateur" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
