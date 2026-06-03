import { apiClient } from "@/core/http/apiClient";
import type {
  Paginated,
  PlatformDriverRechargeStats,
  PlatformDriverTransfer,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const adminDriverTransfersService = {
  getStats: () =>
    apiClient.get<PlatformDriverRechargeStats>(
      "/admin/finance/driver-transfers/stats"
    ),

  list: (params?: ListParams) =>
    apiClient.get<Paginated<PlatformDriverTransfer>>(
      `/admin/finance/driver-transfers${buildListQuery(params)}`
    ),
};
