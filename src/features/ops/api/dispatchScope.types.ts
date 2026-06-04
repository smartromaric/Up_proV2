export interface DispatchScopeFiltersValue {
  franchiseId: number | null;
  partnerId: number | null;
}

export function dispatchScopeQueryParams(
  scope: DispatchScopeFiltersValue
): string {
  const qs = new URLSearchParams();
  if (scope.franchiseId != null) qs.set("franchise_id", String(scope.franchiseId));
  if (scope.partnerId != null) qs.set("partner_id", String(scope.partnerId));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
