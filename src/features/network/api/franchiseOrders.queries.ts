"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import type { TripStatus } from "@/shared/types";
import { franchiseOrdersService } from "./franchiseOrders.service";

export const franchiseOrdersKeys = {
  all: ["admin", "franchise-orders"] as const,
  list: (
    franchiseId: string,
    status?: TripStatus | "all",
    params?: ListParams
  ) =>
    [...franchiseOrdersKeys.all, franchiseId, status, params] as const,
};

export function useFranchiseOrdersList(
  franchiseId: string,
  statusFilter?: TripStatus | "all",
  params?: Omit<ListParams, "status">
) {
  const listParams: ListParams = {
    ...params,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
  };

  return useQuery({
    queryKey: franchiseOrdersKeys.list(franchiseId, statusFilter, listParams),
    queryFn: () => franchiseOrdersService.list(franchiseId, listParams),
    enabled: Boolean(franchiseId),
  });
}
