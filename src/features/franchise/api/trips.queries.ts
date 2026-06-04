"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import type { TripStatus } from "@/shared/types";
import { franchiseTripsService } from "./trips.service";

export const franchiseTripsKeys = {
  all: ["franchise", "trips"] as const,
  list: (status?: TripStatus | "all", params?: ListParams) =>
    [...franchiseTripsKeys.all, "list", status, params] as const,
  detail: (id: string) => [...franchiseTripsKeys.all, "detail", id] as const,
};

export function useFranchiseTripsList(
  statusFilter?: TripStatus | "all",
  params?: ListParams
) {
  const listParams: ListParams = {
    ...params,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
  };
  return useQuery({
    queryKey: franchiseTripsKeys.list(statusFilter, listParams),
    queryFn: () => franchiseTripsService.list(listParams),
  });
}

export function useFranchiseTripDetail(id: string) {
  return useQuery({
    queryKey: franchiseTripsKeys.detail(id),
    queryFn: () => franchiseTripsService.getById(id),
    enabled: Boolean(id),
  });
}
