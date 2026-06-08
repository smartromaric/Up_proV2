import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import { mapApiOrderStatus, orderRef } from "@/features/admin/api/adminOrder.shared";
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import type { Franchise, FranchiseDetail, Paginated, TripStatus } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type {
  ApiDashboardFranchiseOption,
  ApiV1FranchiseDetailResponse,
  ApiV1FranchiseDriversResponse,
  ApiV1FranchiseItem,
  ApiV1FranchisePartnersResponse,
  ApiV1FranchiseRevenueResponse,
} from "./adminFranchises.api.types";
import type { ZoneMapItem } from "../components/AbidjanZonesMap";
import {
  mapAdminPartnerItemToPartner,
  type PartnerLookupMaps,
} from "./adminPartners.mapper";

function mapFranchiseStatus(
  status?: string | null
): Franchise["status"] {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "active") return "active";
  if (key === "suspended") return "suspended";
  return "pending";
}

export function mapV1FranchiseItemToListItem(item: ApiV1FranchiseItem): Franchise {
  const city =
    item.cityLabel?.trim() || item.city?.trim() || "—";

  return {
    id: item.id as unknown as number,
    name: item.name?.trim() || item.legal_name?.trim() || `Franchise ${item.id.slice(0, 8)}`,
    city,
    status: mapFranchiseStatus(item.status),
    partners_count: item.partnersCount ?? 0,
    drivers_count: item.driversCount ?? 0,
    zones_count: item.zonesCount ?? 0,
    revenue_month_fcfa: item.revenueMonthXof ?? 0,
  };
}

export function mapV1FranchisesToPaginated(
  items: ApiV1FranchiseItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<Franchise> {
  const rows = items.map(mapV1FranchiseItemToListItem);
  if (serverPagination) {
    return {
      data: rows,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }
  return paginateClientList(rows, params);
}

export function mapDashboardFranchiseToListItem(
  item: ApiDashboardFranchiseOption,
  cityById?: Map<string, string>
): Franchise {
  const city =
    item.city?.trim() ||
    (item.id && cityById?.get(item.id) ? cityById.get(item.id) : undefined) ||
    "—";

  return {
    id: item.id as unknown as number,
    name: item.name?.trim() || `Franchise ${item.id.slice(0, 8)}`,
    city,
    status: "active",
    partners_count: 0,
    drivers_count: 0,
    zones_count: 0,
    revenue_month_fcfa: 0,
  };
}

export function mapDashboardFranchisesToPaginated(
  items: ApiDashboardFranchiseOption[],
  params?: ListParams,
  cityById?: Map<string, string>
): Paginated<Franchise> {
  const rows = items.map((item) => mapDashboardFranchiseToListItem(item, cityById));
  return paginateClientList(rows, params);
}

function mapFranchiseOrderToRecent(
  order: ApiLiveMapOrderBase
): FranchiseDetail["recent_orders"][0] {
  return {
    id: order.id,
    ref: orderRef(order),
    amount_fcfa: order.final_price_xof ?? order.estimated_price_xof ?? 0,
    status: mapApiOrderStatus(order.status) as TripStatus,
    created_at: order.created_at ?? new Date().toISOString(),
  };
}

export function mapV1FranchiseDetail(
  profile: ApiV1FranchiseDetailResponse,
  partners: ApiV1FranchisePartnersResponse,
  drivers: ApiV1FranchiseDriversResponse,
  revenue: ApiV1FranchiseRevenueResponse,
  lookups?: PartnerLookupMaps,
  franchiseZones: ZoneMapItem[] = [],
  options?: {
    orders?: ApiLiveMapOrderBase[];
    wallet?: FranchiseDetail["wallet"];
    wallet_id?: string | null;
    ledgerTransactions?: FranchiseDetail["recent_transactions"];
  }
): FranchiseDetail {
  const f = profile.franchise;
  const partnerItems = partners.items ?? [];
  const mappedPartners = partnerItems.map((p) => {
    const row = mapAdminPartnerItemToPartner(p, lookups);
    return {
      id: row.id as unknown as number,
      name: row.name,
      drivers_count: row.drivers_count,
      status: row.status,
    };
  });

  const driversTotal = drivers.pagination?.total ?? drivers.items?.length ?? 0;
  const ordersCount = revenue.revenue?.ordersCount ?? 0;
  const totalXof = revenue.revenue?.totalXof ?? 0;

  return {
    id: f.id as unknown as number,
    name: f.name?.trim() || f.legal_name?.trim() || `Franchise ${f.id.slice(0, 8)}`,
    city: "—",
    status: mapFranchiseStatus(f.status),
    partners_count: partners.pagination?.total ?? mappedPartners.length,
    drivers_count: driversTotal,
    zones_count: franchiseZones.length,
    revenue_month_fcfa: totalXof,
    contact_email: f.support_email?.trim() || "—",
    contact_phone: f.support_phone?.trim() || "—",
    created_at: f.created_at ?? new Date().toISOString(),
    stats: {
      partners_count: partners.pagination?.total ?? mappedPartners.length,
      drivers_count: driversTotal,
      zones_count: franchiseZones.length,
      trips_month: ordersCount,
      revenue_month_fcfa: totalXof,
      commission_month_fcfa: 0,
    },
    partners: mappedPartners,
    zones: franchiseZones.map((z) => ({
      id: z.id,
      name: z.name,
      type: z.type,
      drivers_active: 0,
    })),
    wallet_id: options?.wallet_id ?? null,
    wallet: options?.wallet,
    recent_transactions: options?.ledgerTransactions ?? [],
    recent_orders: (options?.orders ?? []).map(mapFranchiseOrderToRecent),
  };
}

export function mapFranchiseListMeta(
  count: number,
  params?: ListParams
): Paginated<Franchise>["meta"] {
  const perPage = params?.per_page ?? 25;
  const page = params?.page ?? 1;
  return mapV1PaginationToMeta(
    {
      page,
      limit: perPage,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / perPage)),
    },
    params
  );
}
