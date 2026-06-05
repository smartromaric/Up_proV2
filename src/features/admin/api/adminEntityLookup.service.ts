import { apiClient } from "@/core/http/apiClient";
import { LINKS, createUrl } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { ListParams } from "@/shared/types/listParams";
import type { ApiAdminOrderDetailResponse } from "@/features/ops/api/adminOrderDetail.api.types";
import type { ApiAdminOrdersResponse } from "@/features/ops/api/adminOrders.api.types";
import type { ApiAdminLiveMapResponse } from "@/features/ops/api/liveMap.api.types";
import type { ApiAdminDriversResponse } from "@/features/fleet/api/adminDrivers.api.types";
import type { ApiLiveMapDriver, ApiLiveMapOrderBase } from "@/features/ops/api/liveMap.api.types";
import {
  collectOrdersFromLiveMap,
  findOrderById,
} from "./adminOrder.shared";

const LIVE_MAP_URL = createUrl(LINKS.admin.v1.liveMap, {
  includeWithoutLocation: "true",
});

export async function fetchAdminLiveMap(): Promise<ApiAdminLiveMapResponse> {
  return apiClient.get<ApiAdminLiveMapResponse>(LIVE_MAP_URL);
}

export async function fetchAdminOrdersList(
  params?: ListParams
): Promise<ApiAdminOrdersResponse> {
  return apiClient.get<ApiAdminOrdersResponse>(
    `${LINKS.admin.v1.orders}${buildV1ListQuery(params)}`
  );
}

/** Détail course admin — préférer cette route à live-map + liste. */
export async function fetchAdminOrderById(
  id: string
): Promise<ApiAdminOrderDetailResponse> {
  return apiClient.get<ApiAdminOrderDetailResponse>(
    LINKS.admin.v1.orderById(id)
  );
}

export async function fetchAdminDriversList(
  params?: ListParams
): Promise<ApiAdminDriversResponse> {
  return apiClient.get<ApiAdminDriversResponse>(
    `${LINKS.admin.v1.drivers}${buildV1ListQuery(params)}`
  );
}

export async function resolveAdminOrder(
  id: string
): Promise<{
  order: ApiLiveMapOrderBase;
  liveMap: ApiAdminLiveMapResponse;
}> {
  const liveMap = await fetchAdminLiveMap();
  const fromLive = findOrderById(collectOrdersFromLiveMap(liveMap), id);
  if (fromLive) {
    return { order: fromLive, liveMap };
  }

  const ordersList = await fetchAdminOrdersList();
  const rides = [...(ordersList.rides ?? []), ...(ordersList.deliveries ?? [])];
  const fromList = findOrderById(rides, id);
  if (!fromList) {
    throw new Error("ORDER_NOT_FOUND");
  }
  return { order: fromList, liveMap };
}

export async function resolveAdminDriver(
  id: string
): Promise<ApiLiveMapDriver | null> {
  const liveMap = await fetchAdminLiveMap();
  const fromLive = (liveMap.drivers ?? []).find((d) => d.id === id);
  if (fromLive) return fromLive;

  const list = await fetchAdminDriversList();
  const item = (list.items ?? []).find((d) => d.id === id);
  if (!item) return null;

  return {
    id: item.id,
    userId: item.user_id,
    driverCode: item.driver_code ?? undefined,
    partnerId: item.partner_id,
    franchiseId: item.franchise_id,
    cityId: item.city_id,
    availabilityStatus: item.availability_status,
    approvalStatus: item.approval_status,
    rideCategoryCode: item.ride_category_code ?? undefined,
    ratingAvg: item.rating_avg ?? undefined,
    partnerName: item.partnerName ?? undefined,
    zoneName: item.zoneName ?? undefined,
    vehicleLabel: item.vehicleLabel ?? item.ride_category_code ?? undefined,
    profile: {
      displayName:
        item.profile?.displayName?.trim() ??
        item.driver_code ??
        `Chauffeur ${item.id.slice(0, 8)}`,
      phone: item.profile?.phone ?? item.phone ?? undefined,
      email: item.profile?.email ?? undefined,
    },
  };
}
