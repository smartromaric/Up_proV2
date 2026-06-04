"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { FranchiseLiveMapFiltersValue } from "./liveMap.types";
import { franchiseDispatchService } from "./dispatch.service";
import { franchiseTripsKeys } from "./trips.queries";

export const franchiseDispatchKeys = {
  all: ["franchise", "dispatch"] as const,
  console: (filters?: FranchiseLiveMapFiltersValue) =>
    [...franchiseDispatchKeys.all, "console", filters] as const,
};

export function useFranchiseDispatchConsole(filters?: FranchiseLiveMapFiltersValue) {
  return useQuery({
    queryKey: franchiseDispatchKeys.console(filters),
    queryFn: () => franchiseDispatchService.getConsole(filters),
    refetchInterval: 15_000,
  });
}

export function useFranchiseAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, driverId }: { tripId: string; driverId: number }) =>
      franchiseDispatchService.assignDriver(tripId, driverId),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchiseDispatchKeys.all });
      void qc.invalidateQueries({ queryKey: franchiseTripsKeys.all });
      notificationService.success(data.message);
    },
    onError: () => {
      notificationService.error("Assignation impossible");
    },
  });
}
