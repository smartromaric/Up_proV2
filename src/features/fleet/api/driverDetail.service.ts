import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { env } from "@/core/config/env";
import { LINKS } from "@/core/api/links";
import type {
  DriverDetail,
  Paginated,
  TripMatchingOutcome,
  TripStatus,
} from "@/shared/types";
import {
  fetchAdminOrdersList,
  resolveAdminDriver,
} from "@/features/admin/api/adminEntityLookup.service";
import {
  mapApiOrderStatus,
  orderRef,
} from "@/features/admin/api/adminOrder.shared";
import type { ApiAdminOrdersResponse } from "@/features/ops/api/adminOrders.api.types";
import type { ApiAdminDriversResponse } from "./adminDrivers.api.types";
import type { ApiV1DriverDetailResponse } from "./driverDetail.v1.api.types";
import {
  mapAdminDriverItemToDetail,
  mapApiV1DriverDetailToDriverDetail,
  mapLiveMapDriverToDetail,
} from "./driverDetail.mapper";

export interface DriverTripRow {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
  offer_outcome?: TripMatchingOutcome;
}

export interface DriverWalletTransaction {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount_fcfa: number;
  balance_after_fcfa: number;
  created_at: string;
}

function useLegacyDriverDetail(): boolean {
  return env.useMocks && !env.useRealAuth;
}

function mapOrdersToDriverTrips(
  driverId: string,
  orders: ApiAdminOrdersResponse
): Paginated<DriverTripRow> {
  const all = [...(orders.rides ?? []), ...(orders.deliveries ?? [])].filter(
    (o) => o.driver_id === driverId
  );
  const data: DriverTripRow[] = all.slice(0, 50).map((o) => ({
    id: o.id,
    ref: orderRef(o),
    from_label: o.pickup_address ?? "—",
    to_label: o.dropoff_address ?? "—",
    status: mapApiOrderStatus(o.status),
    amount_fcfa: o.final_price_xof ?? o.estimated_price_xof ?? 0,
    created_at: o.created_at ?? new Date().toISOString(),
  }));
  return {
    data,
    meta: {
      total: data.length,
      per_page: 50,
      current_page: 1,
      last_page: 1,
    },
  };
}

async function fetchDriverDetailFallback(
  id: string
): Promise<DriverDetail> {
  const driver = await resolveAdminDriver(id);
  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  if (driver.profile?.displayName || driver.profile?.phone) {
    return mapLiveMapDriverToDetail(driver);
  }

  const list = await apiClient.get<ApiAdminDriversResponse>(
    LINKS.admin.v1.drivers
  );
  const item = (list.items ?? []).find((d) => d.id === id);
  if (item) return mapAdminDriverItemToDetail(item);
  return mapLiveMapDriverToDetail(driver);
}

export const driverDetailService = {
  getById: async (id: string | number): Promise<DriverDetail> => {
    if (useLegacyDriverDetail()) {
      return apiClient.get<DriverDetail>(`/admin/drivers/${id}`);
    }

    const driverId = String(id);

    try {
      const response = await apiClient.get<ApiV1DriverDetailResponse>(
        LINKS.v1.drivers.getById(driverId)
      );
      return mapApiV1DriverDetailToDriverDetail(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return fetchDriverDetailFallback(driverId);
      }
      throw error;
    }
  },

  getTrips: async (id: string | number): Promise<Paginated<DriverTripRow>> => {
    if (useLegacyDriverDetail()) {
      return apiClient.get<Paginated<DriverTripRow>>(
        `/admin/drivers/${id}/trips`
      );
    }

    const orders = await fetchAdminOrdersList();
    return mapOrdersToDriverTrips(String(id), orders);
  },

  getWalletTransactions: (id: string | number) =>
    apiClient.get<Paginated<DriverWalletTransaction>>(
      `/admin/drivers/${id}/wallet/transactions`
    ),

  approveKyc: (id: string | number) =>
    apiWithNotify.post(`/admin/drivers/${id}/kyc/approve`, undefined, "KYC approuvé"),

  rejectKyc: (id: string | number, reason: string) =>
    apiWithNotify.post(`/admin/drivers/${id}/kyc/reject`, { reason }, "Document rejeté"),

  suspend: (id: string | number) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/admin/drivers/${id}/suspend`
    ),

  activate: (id: string | number) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/admin/drivers/${id}/activate`
    ),
};
