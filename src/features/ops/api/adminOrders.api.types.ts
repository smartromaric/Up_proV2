import type { ApiLiveMapOrderBase } from "./liveMap.api.types";

/** GET /v1/admin/orders — même forme que live-map.orders */
export interface ApiAdminOrdersResponse {
  status: string;
  generatedAt?: string;
  rides?: ApiLiveMapOrderBase[];
  deliveries?: ApiLiveMapOrderBase[];
}
