"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function LoginPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard>{children}</GuestGuard>;
}
