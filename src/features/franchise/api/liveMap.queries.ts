import { useQuery } from "@tanstack/react-query";
import { franchiseLiveMapService } from "./liveMap.service";
import type { FranchiseLiveMapFiltersValue } from "./liveMap.types";

export const franchiseLiveMapKeys = {
  all: ["franchise", "live-map"] as const,
  map: (filters?: FranchiseLiveMapFiltersValue) =>
    [...franchiseLiveMapKeys.all, filters?.partnerId ?? null] as const,
};

export function useFranchiseLiveMap(filters?: FranchiseLiveMapFiltersValue) {
  return useQuery({
    queryKey: franchiseLiveMapKeys.map(filters),
    queryFn: () => franchiseLiveMapService.get(filters),
    refetchInterval: 30_000,
  });
}
