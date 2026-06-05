import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { ApiLiveMapOrderBase } from "./liveMap.api.types";

export interface ApiAdminOrdersFilterOption {
  id: string;
  name?: string | null;
  city?: string | null;
  cityLabel?: string | null;
  franchiseId?: string | null;
}

export interface ApiAdminOrdersFilterOptions {
  franchises?: ApiAdminOrdersFilterOption[];
  partners?: ApiAdminOrdersFilterOption[];
  cities?: ApiAdminOrdersFilterOption[];
}

/** GET /v1/admin/orders — même forme que live-map.orders */
export interface ApiAdminOrdersResponse {
  status: string;
  generatedAt?: string;
  rides?: ApiLiveMapOrderBase[];
  deliveries?: ApiLiveMapOrderBase[];
  filterOptions?: ApiAdminOrdersFilterOptions;
  pagination?: ApiV1Pagination;
}
