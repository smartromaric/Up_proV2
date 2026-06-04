"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function PartnerLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="partner">{children}</GuestGuard>;
}
