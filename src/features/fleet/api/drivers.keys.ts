import type { ScopeQueryKey } from "@/core/auth/scopeQueryKey";
import type { DriversListParams } from "./drivers.service";

export const driversKeys = {
  all: (scope?: ScopeQueryKey) => ["fleet", "drivers", scope] as const,
  list: (filters?: DriversListParams, scope?: ScopeQueryKey) =>
    [...driversKeys.all(scope), "list", filters] as const,
};
