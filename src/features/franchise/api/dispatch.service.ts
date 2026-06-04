import { apiClient } from "@/core/http/apiClient";
import type { DispatchConsoleData } from "@/shared/types";
import type { FranchiseLiveMapFiltersValue } from "./liveMap.types";
import { franchiseLiveMapQueryParams } from "./liveMap.types";

export const franchiseDispatchService = {
  getConsole: (filters?: FranchiseLiveMapFiltersValue) =>
    apiClient.get<DispatchConsoleData>(
      `/franchise/ops/dispatch${filters ? franchiseLiveMapQueryParams(filters) : ""}`
    ),

  assignDriver: (tripId: string, driverId: number) =>
    apiClient.post<{ ok: boolean; message: string }>(
      `/franchise/ops/dispatch/trips/${tripId}/assign`,
      { driver_id: driverId }
    ),
};
