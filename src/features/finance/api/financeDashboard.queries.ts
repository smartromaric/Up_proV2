"use client";

import { useQuery } from "@tanstack/react-query";
import { financeDashboardService } from "./financeDashboard.service";

export const financeDashboardKeys = {
  all: ["finance", "dashboard"] as const,
  detail: (franchiseId: number | null) =>
    [...financeDashboardKeys.all, franchiseId] as const,
};

export function useAdminFinanceDashboard(franchiseId: number | null = null) {
  return useQuery({
    queryKey: financeDashboardKeys.detail(franchiseId),
    queryFn: () => financeDashboardService.get(franchiseId),
  });
}
