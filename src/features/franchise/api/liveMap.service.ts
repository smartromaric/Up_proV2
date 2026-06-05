import { apiClient } from "@/core/http/apiClient";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, createUrl } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { LiveMapData } from "@/shared/types";
import type { ApiAdminLiveMapResponse } from "@/features/ops/api/liveMap.api.types";
import { mapApiLiveMapToData } from "@/features/ops/api/liveMap.mapper";
import type { LiveMapScopeFiltersValue } from "@/features/ops/api/liveMap.types";
import {
  franchiseLiveMapQueryParams,
  type FranchiseLiveMapFiltersValue,
} from "./liveMap.types";

function buildFranchiseLiveMapEndpoint(
  franchiseId: string,
  filters?: FranchiseLiveMapFiltersValue
): string {
  const partnerId =
    filters?.partnerId != null ? String(filters.partnerId) : undefined;
  return createUrl(LINKS.admin.v1.liveMap, {
    franchiseId,
    partnerId,
    includeWithoutLocation: "true",
  });
}

export const franchiseLiveMapService = {
  get: async (
    filters?: FranchiseLiveMapFiltersValue
  ): Promise<LiveMapData> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<LiveMapData>(
        `${LINKS.franchise.ops.map}${filters ? franchiseLiveMapQueryParams(filters) : ""}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const scopeFilters: LiveMapScopeFiltersValue = {
      franchiseId,
      partnerId: filters?.partnerId ?? null,
    };

    const [data, partners] = await Promise.all([
      apiClient.get<ApiAdminLiveMapResponse>(
        buildFranchiseLiveMapEndpoint(franchiseId, filters)
      ),
      apiClient.get<{ items?: { id: string; trade_name?: string; legal_name?: string; city_id?: string }[] }>(
        `${LINKS.admin.franchises.partners(franchiseId)}?limit=100`
      ),
    ]);

    const mapped = mapApiLiveMapToData(data, scopeFilters);
    const partnerOptions = (partners.items ?? []).map((p) => ({
      id: p.id,
      name: p.trade_name?.trim() || p.legal_name?.trim() || `Partenaire ${p.id.slice(0, 8)}`,
      franchise_id: franchiseId,
      franchise_name: mapped.zone_name,
      city: "—",
    }));

    return {
      ...mapped,
      filter_options: {
        franchises: [],
        partners: partnerOptions,
      },
    };
  },
};
