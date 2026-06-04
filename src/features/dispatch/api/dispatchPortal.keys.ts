import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";
import type { DispatchScopeFiltersValue } from "@/features/ops/api/dispatchScope.types";

export const dispatchPortalKeys = {
  all: (scope?: ScopeQueryKey) => ["dispatch-portal", scope] as const,
  console: (
    scope?: ScopeQueryKey,
    filters?: DispatchScopeFiltersValue
  ) => [...dispatchPortalKeys.all(scope), "console", filters] as const,
  map: (scope?: ScopeQueryKey) =>
    [...dispatchPortalKeys.all(scope), "map"] as const,
};
