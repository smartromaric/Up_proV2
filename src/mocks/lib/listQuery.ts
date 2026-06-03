import { paginate, type PaginateParams } from "./paginate";

export interface ListQuery extends PaginateParams {
  search: string | null;
  status: string | null;
  zone: string | null;
  zone_id: number | null;
  availability: string | null;
  account_status: string | null;
  type: string | null;
  service: string | null;
  franchise_id: number | null;
  partner_id: number | null;
}

export function parseListQuery(request: Request): ListQuery {
  const url = new URL(request.url);
  const zoneIdRaw = url.searchParams.get("zone_id");
  return {
    page: Number(url.searchParams.get("page") ?? "1"),
    per_page: Number(url.searchParams.get("per_page") ?? "25"),
    search: url.searchParams.get("search"),
    status: url.searchParams.get("status"),
    zone: url.searchParams.get("zone"),
    zone_id: zoneIdRaw ? Number(zoneIdRaw) : null,
    availability: url.searchParams.get("availability"),
    account_status: url.searchParams.get("account_status"),
    type: url.searchParams.get("type"),
    service: url.searchParams.get("service"),
    franchise_id: parseIdParam(url.searchParams.get("franchise_id")),
    partner_id: parseIdParam(url.searchParams.get("partner_id")),
  };
}

function parseIdParam(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function matchesSearch(
  search: string | null,
  ...parts: (string | null | undefined)[]
): boolean {
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  return parts.some((p) => (p ?? "").toLowerCase().includes(q));
}

export function paginatedList<T>(items: T[], query: ListQuery) {
  return paginate(items, { page: query.page, per_page: query.per_page });
}
