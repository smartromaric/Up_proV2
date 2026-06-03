import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";
import type { ListParams } from "@/shared/types/listParams";

export const dispatchersKeys = {
  all: (scope?: ScopeQueryKey) => ["dispatchers", scope] as const,
  list: (filters?: ListParams, scope?: ScopeQueryKey) =>
    [...dispatchersKeys.all(scope), "list", filters] as const,
  detail: (id: string, scope?: ScopeQueryKey) =>
    [...dispatchersKeys.all(scope), "detail", id] as const,
};
