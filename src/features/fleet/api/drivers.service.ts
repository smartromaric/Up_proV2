import { apiClient } from "@/core/http/apiClient";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchAdminDriversList } from "@/features/admin/api/adminEntityLookup.service";
import type { Driver, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import { mapAdminDriversToPaginated } from "./adminDrivers.mapper";

export type DriversListParams = ListParams;

export const driversService = {
  listAdmin: async (
    params?: DriversListParams
  ): Promise<Paginated<Driver>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Driver>>(
        `/admin/drivers${buildListQuery(params)}`
      );
    }

    const response = await fetchAdminDriversList(params);
    return mapAdminDriversToPaginated(
      response.items ?? [],
      params,
      response.pagination
    );
  },
};
