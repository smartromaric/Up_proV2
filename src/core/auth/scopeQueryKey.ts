import { useMemo } from "react";
import { useAuthStore } from "./authStore";
import type { User } from "@/shared/types";

/** Segment stable pour les query keys TanStack (invalidation par scope). */
export type ScopeQueryKey = {
  scope: string;
  franchiseId: string | number | null;
  ownerId: string | number | null;
  role: string | null;
};

export function scopeQueryKey(user: User | null | undefined): ScopeQueryKey {
  return {
    scope: user?.scope ?? "platform",
    franchiseId: user?.franchise_id ?? null,
    ownerId: user?.owner_id ?? null,
    role: user?.role ?? null,
  };
}

export function useScopeQueryKey(): ScopeQueryKey {
  const user = useAuthStore((s) => s.user);
  return useMemo(
    () => scopeQueryKey(user),
    [user?.scope, user?.franchise_id, user?.owner_id, user?.role]
  );
}
