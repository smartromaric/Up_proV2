"use client";

import { useQuery } from "@tanstack/react-query";
import { env } from "@/core/config/env";
import { LIVE_MAP_HTTP_POLL_MS } from "./liveMap.queries";
import {
  fetchLiveMapHotZones,
  filterHotZonesByFranchise,
} from "./liveMapHotZones.service";
import type { LiveMapScopeFiltersValue } from "./liveMap.types";
import type { ScopeId } from "@/shared/lib/scopeId";

export const liveMapHotZonesKeys = {
  all: ["ops", "live-map", "hot-zones"] as const,
};

function isLegacyLiveMap(): boolean {
  return env.useMocks && !env.useRealAuth;
}

export function useLiveMapHotZones(filters?: LiveMapScopeFiltersValue) {
  return useQuery({
    queryKey: [
      ...liveMapHotZonesKeys.all,
      filters?.franchiseId ?? null,
    ] as const,
    queryFn: async () => {
      const zones = await fetchLiveMapHotZones();
      return filterHotZonesByFranchise(zones, filters?.franchiseId);
    },
    enabled: !isLegacyLiveMap(),
    staleTime: 0,
    refetchInterval: LIVE_MAP_HTTP_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useLiveMapHotZonesForScope(franchiseId?: ScopeId | null) {
  return useLiveMapHotZones({ franchiseId: franchiseId ?? null, partnerId: null });
}
