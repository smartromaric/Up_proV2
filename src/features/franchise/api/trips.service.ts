import { apiClient } from "@/core/http/apiClient";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { tripDetailService } from "@/features/ops/api/tripDetail.service";
import type { TripDetail, TripsListResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapFranchiseOrdersToTripsList,
  type ApiFranchiseOrdersResponse,
} from "./franchisePortal.mapper";

export const franchiseTripsService = {
  list: async (params?: ListParams): Promise<TripsListResponse> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<TripsListResponse>(
        `${LINKS.franchise.ops.trips.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.get<ApiFranchiseOrdersResponse>(
      `${LINKS.admin.franchises.orders(franchiseId)}${buildV1ListQuery(params)}`
    );
    return mapFranchiseOrdersToTripsList(response, params);
  },

  getById: (id: string): Promise<TripDetail> =>
    useLegacyPortalApi()
      ? apiClient.get<TripDetail>(`${LINKS.franchise.ops.trips.getById(id)}`)
      : tripDetailService.getById(id),
};
