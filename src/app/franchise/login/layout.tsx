"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function FranchiseLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="franchise">{children}</GuestGuard>;
}
