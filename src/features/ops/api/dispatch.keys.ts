import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";

export const dispatchKeys = {
  all: (scope?: ScopeQueryKey) => ["dispatch", scope] as const,
  console: (scope?: ScopeQueryKey) =>
    [...dispatchKeys.all(scope), "console"] as const,
};
