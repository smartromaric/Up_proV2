import { apiClient } from "@/core/http/apiClient";
import type { Driver, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type DriversListParams = ListParams;

export const driversService = {
  listAdmin: (params?: DriversListParams) =>
    apiClient.get<Paginated<Driver>>(`/admin/drivers${buildListQuery(params)}`),
};
