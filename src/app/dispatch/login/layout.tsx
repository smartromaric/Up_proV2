"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function DispatchLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="dispatch">{children}</GuestGuard>;
}
