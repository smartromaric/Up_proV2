/** Paramètres communs pour les listes paginées côté API. */
export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  zone?: string;
  zone_id?: number;
  availability?: string;
  account_status?: string;
  type?: string;
  service?: string;
  franchise_id?: number;
  partner_id?: number;
}

export function buildListQuery(params?: ListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.zone && params.zone !== "all") qs.set("zone", params.zone);
  if (params.zone_id != null) qs.set("zone_id", String(params.zone_id));
  if (params.availability && params.availability !== "all") {
    qs.set("availability", params.availability);
  }
  if (params.account_status && params.account_status !== "all") {
    qs.set("account_status", params.account_status);
  }
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.service && params.service !== "all") qs.set("service", params.service);
  if (params.franchise_id != null) qs.set("franchise_id", String(params.franchise_id));
  if (params.partner_id != null) qs.set("partner_id", String(params.partner_id));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
