import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

// Structure API brute pour vehicle-performance (retourne des véhicules, pas des métriques)
interface ApiVehiclePerformanceItem {
  id: string;
  partner_id: string;
  driver_id: string | null;
  brand_id: string | null;
  model_id: string | null;
  plate_number: string | null;
  status: string;
  manufacture_year: number | null;
  seats_count: number | null;
  metadata?: {
    brand?: string;
    model?: string;
    category?: string;
  };
  created_at: string;
  updated_at: string;
}

interface PerformanceApiResponse<T> {
  status: string;
  items?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapApiVehicleToPerformance(item: ApiVehiclePerformanceItem): VehiclePerformance {
  const brand = item.metadata?.brand || "—";
  const model = item.metadata?.model || "";
  
  return {
    id: item.id,
    vehicle_id: item.id,
    brand: brand,
    model: model,
    plate: item.plate_number || undefined,
    // NOTE: L'API ne retourne pas de métriques de performance réelles
    // Ces valeurs sont des placeholders en attendant l'implémentation backend
    total_km: 0,
    trips_count: 0,
    revenue_fcfa: 0,
    acceptance_rate_pct: 0,
    avg_rating: 0,
    period: "N/A",
  };
}

function mapVehiclePerformanceResponse(
  response: PerformanceApiResponse<ApiVehiclePerformanceItem>
): Paginated<VehiclePerformance> {
  if ("status" in response && response.status === "ok" && response.items) {
    const data = response.items.map(item => mapApiVehicleToPerformance(item));
    
    return {
      data,
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
    };
  }
  return { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
}

function mapDriverPerformanceResponse<T>(
  response: PerformanceApiResponse<T> | Paginated<T>
): Paginated<T> {
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
    return response as Paginated<T>;
  }
  return response as Paginated<T>;
}

export interface VehiclePerformance {
  id: string;
  vehicle_id: string;
  brand: string;
  model: string;
  plate?: string;
  total_km: number;
  trips_count: number;
  revenue_fcfa: number;
  acceptance_rate_pct: number;
  avg_rating: number;
  period: string;
}

export interface DriverPerformance {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  trips_completed: number;
  trips_cancelled: number;
  revenue_fcfa: number;
  avg_rating: number;
  acceptance_rate_pct: number;
  cancellation_rate_pct: number;
  period: string;
}

export const partnerPerformanceService = {
  vehicles: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<PerformanceApiResponse<ApiVehiclePerformanceItem>>(
      `${LINKS.partner.vehicles.performance(partnerId)}${buildListQuery(params)}`
    );
    return mapVehiclePerformanceResponse(response);
  },

  drivers: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<PerformanceApiResponse<DriverPerformance>>(
      `${LINKS.partner.vehicles.driverPerformance(partnerId)}${buildListQuery(params)}`
    );
    return mapDriverPerformanceResponse<DriverPerformance>(response);
  },
};
