import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type SosStatus = "active" | "acknowledged" | "resolved" | "cancelled";
export type SosType = "panic_button" | "crash_detected" | "manual_report" | "deviation";

export interface SosIncident {
  id: string;
  driver_id: string;
  driver_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  type: SosType;
  status: SosStatus;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  note?: string;
}

export interface SosDashboard {
  active_count: number;
  acknowledged_count: number;
  today_count: number;
  last_incidents: SosIncident[];
}

export interface AcknowledgeSosPayload {
  note?: string;
}

// Structure API brute (nouveau format backend)
interface SosApiResponse {
  status: string;
  items?: SosIncident[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapSosResponse(response: SosApiResponse | Paginated<SosIncident>): Paginated<SosIncident> {
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
    return response as Paginated<SosIncident>;
  }
  return response as Paginated<SosIncident>;
}

export const partnerSafetyService = {
  listSos: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<SosApiResponse>(
      `${LINKS.partner.safety.sos.list(partnerId)}${buildListQuery(params)}`
    );
    return mapSosResponse(response);
  },

  getSosById: async (partnerId: string | number, sosId: string | number) => {
    const response = await apiClient.get<SosIncident>(
      LINKS.partner.safety.sos.getById(partnerId, sosId)
    );
    return response;
  },

  acknowledgeSos: async (
    partnerId: string | number,
    sosId: string | number,
    data?: AcknowledgeSosPayload
  ) => {
    const response = await apiClient.post<SosIncident>(
      LINKS.partner.safety.sos.acknowledge(partnerId, sosId),
      data ?? {}
    );
    return response;
  },

  getDashboard: async (partnerId: string | number) => {
    const response = await apiClient.get<SosDashboard>(
      LINKS.partner.safety.sos.dashboard(partnerId)
    );
    return response;
  },
};
