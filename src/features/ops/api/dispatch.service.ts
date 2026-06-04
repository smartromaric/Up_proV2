import { apiClient } from "@/core/http/apiClient";
import type { DispatchConsoleData, Trip } from "@/shared/types";
import {
  dispatchScopeQueryParams,
  type DispatchScopeFiltersValue,
} from "./dispatchScope.types";

export const dispatchService = {
  getConsole: (scope?: DispatchScopeFiltersValue) =>
    apiClient.get<DispatchConsoleData>(
      `/admin/ops/dispatch${scope ? dispatchScopeQueryParams(scope) : ""}`
    ),

  assignDriver: (tripId: string, driverId: number) =>
    apiClient.post<{ ok: boolean; trip: Trip; message: string }>(
      `/admin/ops/dispatch/trips/${tripId}/assign`,
      { driver_id: driverId }
    ),
};
