"use client";

import { useQuery } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { tripsKeys } from "./trips.keys";
import { tripsService } from "./trips.service";
import type { ListParams } from "@/shared/types/listParams";
import type { TripStatus } from "@/shared/types";

export function useTripsList(
  statusFilter?: TripStatus | "all",
  params?: Omit<ListParams, "status">
) {
  const scopeKey = useScopeQueryKey();
  const listParams: ListParams = {
    ...params,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
  };
  return useQuery({
    queryKey: tripsKeys.list(statusFilter, scopeKey, listParams),
    queryFn: () => tripsService.listAdmin(listParams),
  });
}
