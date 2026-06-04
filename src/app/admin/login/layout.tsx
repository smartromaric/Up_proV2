"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="admin">{children}</GuestGuard>;
}
