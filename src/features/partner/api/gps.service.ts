import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

// Structure API brute (nouveau format backend)
interface GpsDevicesApiResponse {
  status: string;
  items?: GpsDevice[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapGpsDevicesResponse(response: GpsDevicesApiResponse | Paginated<GpsDevice>): Paginated<GpsDevice> {
  if ("status" in response && response.status === "ok" && response.items) {
    return {
      data: response.items,
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return response as Paginated<GpsDevice>;
  }
  return response as Paginated<GpsDevice>;
}

export interface GpsDevice {
  id: string;
  device_id: string;
  vehicle_id?: string;
  vehicle_label?: string;
  imei: string;
  status: "online" | "offline" | "maintenance";
  last_seen_at?: string;
  battery_level_pct?: number;
  signal_strength?: number;
  location?: {
    lat: number;
    lng: number;
    recorded_at: string;
  };
  created_at: string;
}

export interface UpdateGpsDevicePayload {
  vehicle_id?: string;
  status?: GpsDevice["status"];
}

export interface CreateGpsDevicePayload {
  imei: string;
  device_id?: string;
  vehicle_id?: string;
}

export const partnerGpsService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<GpsDevicesApiResponse>(
      `${LINKS.partner.vehicles.gpsDevices.list(partnerId)}${buildListQuery(params)}`
    );
    return mapGpsDevicesResponse(response);
  },

  create: (partnerId: string | number, data: CreateGpsDevicePayload) =>
    apiClient.post<GpsDevice>(
      LINKS.partner.vehicles.gpsDevices.create(partnerId),
      data
    ),

  update: (partnerId: string | number, deviceId: string, data: UpdateGpsDevicePayload) =>
    apiClient.patch<GpsDevice>(
      LINKS.partner.vehicles.gpsDevices.update(partnerId, deviceId),
      data
    ),

  delete: (partnerId: string | number, deviceId: string) =>
    apiClient.delete<{ ok: boolean }>(
      LINKS.partner.vehicles.gpsDevices.delete(partnerId, deviceId)
    ),
};
