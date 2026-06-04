import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData } from "@/shared/types";
import {
  franchiseLiveMapQueryParams,
  type FranchiseLiveMapFiltersValue,
} from "./liveMap.types";

export const franchiseLiveMapService = {
  get: (filters?: FranchiseLiveMapFiltersValue) =>
    apiClient.get<LiveMapData>(
      `/franchise/ops/map${filters ? franchiseLiveMapQueryParams(filters) : ""}`
    ),
};
