import { apiClient } from "@/core/http/apiClient";
import type { TripDetail, TripsListResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const franchiseTripsService = {
  list: (params?: ListParams) =>
    apiClient.get<TripsListResponse>(
      `/franchise/ops/trips${buildListQuery(params)}`
    ),

  getById: (id: string) => apiClient.get<TripDetail>(`/franchise/ops/trips/${id}`),
};
