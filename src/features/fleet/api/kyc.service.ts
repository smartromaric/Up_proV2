import { apiClient } from "@/core/http/apiClient";
import type { KycQueueItem, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const kycService = {
  getQueue: (params?: ListParams) =>
    apiClient.get<Paginated<KycQueueItem>>(
      `/admin/fleet/kyc${buildListQuery(params)}`
    ),
};
