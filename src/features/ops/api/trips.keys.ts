import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";
import type { TripStatus } from "@/shared/types";

export const tripsKeys = {
  all: (scope?: ScopeQueryKey) => ["ops", "trips", scope] as const,
  list: (
    status?: TripStatus | "all",
    scope?: ScopeQueryKey,
    params?: unknown
  ) => [...tripsKeys.all(scope), "list", status, params] as const,
};
