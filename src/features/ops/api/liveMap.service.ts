import { apiClient } from "@/core/http/apiClient";
import { env } from "@/core/config/env";
import { LINKS, createUrl } from "@/core/api/links";
import type { LiveMapData } from "@/shared/types";
import type { ApiAdminLiveMapResponse } from "./liveMap.api.types";
import { mapApiLiveMapToData } from "./liveMap.mapper";
import type { LiveMapScopeFiltersValue } from "./liveMap.types";

function useLegacyLiveMap(): boolean {
  return env.useMocks && !env.useRealAuth;
}

function buildLegacyQuery(filters?: LiveMapScopeFiltersValue): string {
  const params = new URLSearchParams();
  if (typeof filters?.franchiseId === "number") {
    params.set("franchise_id", String(filters.franchiseId));
  }
  if (typeof filters?.partnerId === "number") {
    params.set("partner_id", String(filters.partnerId));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function buildV1Endpoint(filters?: LiveMapScopeFiltersValue): string {
  return createUrl(LINKS.admin.v1.liveMap, {
    includeWithoutLocation: "true",
    franchiseId:
      filters?.franchiseId != null ? String(filters.franchiseId) : undefined,
    partnerId:
      filters?.partnerId != null ? String(filters.partnerId) : undefined,
  });
}

export const liveMapService = {
  getAdmin: async (
    filters?: LiveMapScopeFiltersValue
  ): Promise<LiveMapData> => {
    if (useLegacyLiveMap()) {
      return apiClient.get<LiveMapData>(
        `${LINKS.admin.ops.map}${buildLegacyQuery(filters)}`
      );
    }

    const data = await apiClient.get<ApiAdminLiveMapResponse>(
      buildV1Endpoint(filters)
    );
    return mapApiLiveMapToData(data, filters);
  },
};
