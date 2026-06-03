import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";

export const dispatchPortalKeys = {
  all: (scope?: ScopeQueryKey) => ["dispatch-portal", scope] as const,
  console: (scope?: ScopeQueryKey) =>
    [...dispatchPortalKeys.all(scope), "console"] as const,
  map: (scope?: ScopeQueryKey) =>
    [...dispatchPortalKeys.all(scope), "map"] as const,
};
