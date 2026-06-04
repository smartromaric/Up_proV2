import { PortalSidebar } from "@/portals/shared/PortalSidebar";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { FranchiseChatSoundListener } from "@/features/support/components/FranchiseChatSoundListener";
import { FRANCHISE_NAV } from "./franchiseNav";

export function FranchiseShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <FranchiseChatSoundListener />
      <PortalSidebar nav={FRANCHISE_NAV} subtitle="Franchise" />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          scopeLabel="Pays · Côte d'Ivoire"
          badge="Franchise"
          loginPath="/franchise/login"
        />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
