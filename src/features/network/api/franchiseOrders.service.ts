import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import {
  mapFranchiseOrdersToTripsList,
  type ApiFranchiseOrdersResponse,
} from "@/features/franchise/api/franchisePortal.mapper";
import type { TripsListResponse } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";

export const franchiseOrdersService = {
  list: async (
    franchiseId: string,
    params?: ListParams
  ): Promise<TripsListResponse> => {
    const response = await apiClient.get<ApiFranchiseOrdersResponse>(
      `${LINKS.admin.franchises.orders(franchiseId)}${buildV1ListQuery(params)}`
    );
    return mapFranchiseOrdersToTripsList(response, params);
  },
};
