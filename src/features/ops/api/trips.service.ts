import { apiClient } from "@/core/http/apiClient";
import type { TripsListResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const tripsService = {
  listAdmin: (params?: ListParams) =>
    apiClient.get<TripsListResponse>(`/admin/ops/trips${buildListQuery(params)}`),
};
