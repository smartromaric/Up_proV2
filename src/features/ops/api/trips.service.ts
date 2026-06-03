import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Trip } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const tripsService = {
  listAdmin: (params?: ListParams) =>
    apiClient.get<Paginated<Trip>>(`/admin/ops/trips${buildListQuery(params)}`),
};
