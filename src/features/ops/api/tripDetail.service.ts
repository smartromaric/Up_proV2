import { apiClient } from "@/core/http/apiClient";
import { env } from "@/core/config/env";
import type { TripDetail } from "@/shared/types";
import {
  fetchAdminOrderById,
  resolveAdminOrder,
} from "@/features/admin/api/adminEntityLookup.service";
import { mapAdminOrderDetailToTripDetail } from "./adminOrderDetail.mapper";
import { ApiError } from "@/core/http/errorHandler";
import {
  indexLiveMapDrivers,
  mapApiOrderToTripDetail,
} from "./orderDetail.mapper";

export interface ReassignCandidate {
  id: number;
  name: string;
  vehicle: string;
}

function useLegacyTripDetail(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export const tripDetailService = {
  getById: async (id: string): Promise<TripDetail> => {
    if (useLegacyTripDetail()) {
      return apiClient.get<TripDetail>(`/admin/ops/trips/${id}`);
    }

    try {
      const detail = await fetchAdminOrderById(id);
      return mapAdminOrderDetailToTripDetail(detail.order);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw error;
      }
    }

    const { order, liveMap } = await resolveAdminOrder(id);
    const driversById = indexLiveMapDrivers(liveMap);
    return mapApiOrderToTripDetail(order, driversById);
  },

  getReassignCandidates: (id: string) =>
    apiClient.get<{ data: ReassignCandidate[] }>(
      `/admin/ops/trips/${id}/reassign-candidates`
    ),

  reassign: (id: string, driverId: number) =>
    apiClient.post<{ ok: boolean; trip: TripDetail; message: string }>(
      `/admin/ops/trips/${id}/reassign`,
      { driver_id: driverId }
    ),
};
