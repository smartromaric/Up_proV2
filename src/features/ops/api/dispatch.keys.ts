import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";
import type { DispatchScopeFiltersValue } from "./dispatchScope.types";

export const dispatchKeys = {
  all: (scope?: ScopeQueryKey) => ["dispatch", scope] as const,
  console: (
    scope?: ScopeQueryKey,
    filters?: DispatchScopeFiltersValue
  ) => [...dispatchKeys.all(scope), "console", filters] as const,
};
