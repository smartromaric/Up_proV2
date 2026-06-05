import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiAdminDriverItem } from "@/features/fleet/api/adminDrivers.api.types";
import { mapAdminDriverItemToListDriver } from "@/features/fleet/api/adminDrivers.mapper";
import {
  mapApiOrderStatus,
  mapApiPaymentMethod,
  mapApiServiceType,
  orderRef,
} from "@/features/admin/api/adminOrder.shared";
import type { ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import type { Driver, Paginated, Trip, TripsListResponse } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";

export interface ApiFranchiseOrdersResponse {
  status?: string;
  orders?: ApiLiveMapOrderBase[];
  pagination?: ApiV1Pagination;
}

export function mapFranchiseDriversToPaginated(
  items: ApiAdminDriverItem[],
  params?: ListParams,
  serverPagination?: ApiV1Pagination
): Paginated<Driver> {
  const rows = items.map(mapAdminDriverItemToListDriver);
  if (serverPagination) {
    return {
      data: rows,
      meta: mapV1PaginationToMeta(serverPagination, params),
    };
  }
  return paginateClientList(rows, params);
}

function mapFranchiseOrderToTrip(order: ApiLiveMapOrderBase): Trip {
  const amount = order.final_price_xof ?? order.estimated_price_xof ?? 0;
  return {
    id: order.id,
    ref: orderRef(order),
    service: mapApiServiceType(order.service_type),
    from_label: order.pickup_address ?? "—",
    to_label: order.dropoff_address ?? "—",
    client_name:
      order.client?.displayName?.trim() ??
      (order.client_id
        ? `Client ${String(order.client_id).slice(0, 8)}`
        : "Client"),
    driver_name: order.driver_id
      ? `Chauffeur ${String(order.driver_id).slice(0, 8)}`
      : undefined,
    amount_fcfa: amount,
    status: mapApiOrderStatus(order.status),
    payment_method: mapApiPaymentMethod(order.payment_method_code),
    created_at: order.created_at ?? new Date().toISOString(),
    franchise_id: order.franchise_id
      ? String(order.franchise_id)
      : undefined,
  };
}

export function mapFranchiseOrdersToTripsList(
  response: ApiFranchiseOrdersResponse,
  params?: ListParams
): TripsListResponse {
  const orders = [...(response.orders ?? [])].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );
  const trips = orders.map(mapFranchiseOrderToTrip);
  const paginated = response.pagination
    ? {
        data: trips,
        meta: mapV1PaginationToMeta(response.pagination, params),
      }
    : paginateClientList(trips, params);

  return {
    data: paginated.data,
    meta: paginated.meta,
    filter_options: { franchises: [], partners: [] },
  };
}
