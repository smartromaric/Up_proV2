"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { PortalSidebar } from "@/portals/shared/PortalSidebar";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { DISPATCH_NAV } from "./dispatchNav";

export function DispatchShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const zones =
    user?.zone_names?.length ? user.zone_names.join(" · ") : "Zones assignées";

  return (
    <div className="flex min-h-screen bg-canvas">
      <PortalSidebar nav={DISPATCH_NAV} subtitle="Dispatch" />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          scopeLabel={`Dispatch · ${zones}`}
          badge="Dispatcher"
          loginPath="/dispatch/login"
        />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
