export interface FranchiseLiveMapFiltersValue {
  partnerId: number | null;
}

export function franchiseLiveMapQueryParams(
  filters: FranchiseLiveMapFiltersValue
): string {
  if (filters.partnerId == null) return "";
  return `?partner_id=${filters.partnerId}`;
}
