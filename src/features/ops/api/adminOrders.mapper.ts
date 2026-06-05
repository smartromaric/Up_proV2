import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Trip, TripsListResponse, TripsScopeFilterOptions } from "@/shared/types";
import type { ApiAdminOrdersFilterOptions } from "./adminOrders.api.types";
import type { ListParams } from "@/shared/types/listParams";
import type { ApiAdminDriverItem } from "@/features/fleet/api/adminDrivers.api.types";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ApiAdminOrdersResponse } from "./adminOrders.api.types";
import type { ApiLiveMapOrderBase } from "./liveMap.api.types";
import {
  mapApiOrderStatus,
  mapApiPaymentMethod,
  mapApiServiceType,
  orderRef,
} from "@/features/admin/api/adminOrder.shared";

function driverLabel(
  order: ApiLiveMapOrderBase,
  driversById: Map<string, ApiAdminDriverItem>
): string | undefined {
  const embedded = order.driver?.displayName?.trim();
  if (embedded) return embedded;

  const driverId = order.driver_id;
  if (!driverId) return undefined;

  const d = driversById.get(driverId);
  if (!d) return `Chauffeur ${driverId.slice(0, 8)}`;

  return (
    d.profile?.displayName?.trim() ??
    d.driver_code ??
    `Chauffeur ${driverId.slice(0, 8)}`
  );
}

export function mapApiOrderToTrip(
  order: ApiLiveMapOrderBase,
  driversById: Map<string, ApiAdminDriverItem>
): Trip {
  const amount =
    order.final_price_xof ?? order.estimated_price_xof ?? 0;

  return {
    id: order.id,
    ref: orderRef(order),
    service: mapApiServiceType(order.service_type),
    from_label: order.pickup_address ?? "—",
    to_label: order.dropoff_address ?? "—",
    client_name:
      order.client?.displayName?.trim() ??
      (order.metadata?.clientDisplayName as string | undefined) ??
      (order.client_id
        ? `Client ${String(order.client_id).slice(0, 8)}`
        : "Client"),
    driver_name: driverLabel(order, driversById),
    amount_fcfa: amount,
    status: mapApiOrderStatus(order.status),
    payment_method: mapApiPaymentMethod(order.payment_method_code),
    created_at: order.created_at ?? new Date().toISOString(),
    franchise_id: order.franchise_id
      ? String(order.franchise_id)
      : undefined,
    franchise_name: order.franchiseName ?? undefined,
    partner_name: order.partnerName ?? undefined,
  };
}

function tripMatchesDateRange(trip: Trip, params?: ListParams): boolean {
  const from = params?.date_from?.trim();
  const to = params?.date_to?.trim();
  if (!from && !to) return true;

  const created = new Date(trip.created_at);
  if (Number.isNaN(created.getTime())) return false;

  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (created < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (created > end) return false;
  }
  return true;
}

function tripMatchesFilters(trip: Trip, params?: ListParams): boolean {
  if (params?.status && trip.status !== params.status) return false;
  if (params?.service && trip.service !== params.service) return false;
  if (params?.franchise_id != null) {
    const fid = String(params.franchise_id);
    if (trip.franchise_id !== fid) return false;
  }
  if (params?.partner_id != null) {
    const pid = String(params.partner_id);
    if (trip.partner_id !== pid) return false;
  }
  if (!tripMatchesDateRange(trip, params)) return false;
  return true;
}

/** Filtres périmètre embarqués dans GET /v1/admin/orders (juin 2026). */
export function mapOrdersFilterOptions(
  options?: ApiAdminOrdersFilterOptions | null
): TripsScopeFilterOptions {
  if (!options) {
    return { franchises: [], partners: [] };
  }
  return {
    franchises: (options.franchises ?? []).map((f) => ({
      id: f.id,
      name: f.name?.trim() || `Franchise ${f.id.slice(0, 8)}`,
      city: f.cityLabel?.trim() || f.city?.trim() || "—",
    })),
    partners: (options.partners ?? []).map((p) => ({
      id: p.id,
      name: p.name?.trim() || `Partenaire ${p.id.slice(0, 8)}`,
      franchise_id: p.franchiseId ?? "",
      franchise_name: "—",
      city: "—",
    })),
  };
}

export function mapAdminOrdersToTripsListResponse(
  response: ApiAdminOrdersResponse,
  driversById: Map<string, ApiAdminDriverItem>,
  params?: ListParams,
  filterOptions?: TripsScopeFilterOptions,
  serverPagination?: ApiV1Pagination
): TripsListResponse {
  const orders = [
    ...(response.rides ?? []),
    ...(response.deliveries ?? []),
  ].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );

  const trips = orders
    .map((o) => mapApiOrderToTrip(o, driversById))
    .filter((t) => tripMatchesFilters(t, params));

  if (serverPagination) {
    return {
      data: trips,
      meta: mapV1PaginationToMeta(serverPagination, params),
      filter_options: filterOptions ?? { franchises: [], partners: [] },
    };
  }

  const page = paginateClientList(trips, params, (t) =>
    tripMatchesFilters(t, params)
  );

  return {
    ...page,
    filter_options: filterOptions ?? { franchises: [], partners: [] },
  };
}
