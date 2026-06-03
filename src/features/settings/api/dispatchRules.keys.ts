import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";

export const dispatchRulesKeys = {
  all: (scope?: ScopeQueryKey) => ["dispatch-rules", scope] as const,
  detail: (scope?: ScopeQueryKey) =>
    [...dispatchRulesKeys.all(scope), "detail"] as const,
};
