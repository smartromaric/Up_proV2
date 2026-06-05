import type { ScopeId } from "@/shared/lib/scopeId";

export interface FranchiseLiveMapFiltersValue {
  partnerId: ScopeId | null;
}

export function franchiseLiveMapQueryParams(
  filters: FranchiseLiveMapFiltersValue
): string {
  if (filters.partnerId == null) return "";
  return `?partner_id=${filters.partnerId}`;
}
