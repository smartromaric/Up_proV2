"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { DispatchShell } from "@/portals/dispatch/DispatchShell";

export default function DispatchPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="dispatch">
      <DispatchShell>{children}</DispatchShell>
    </AuthGuard>
  );
}
