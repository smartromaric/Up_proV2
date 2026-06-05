"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminDashboardFranchiseFilter } from "@/features/ops/api/dashboard.types";
import { financeDashboardService } from "./financeDashboard.service";

export const financeDashboardKeys = {
  all: ["finance", "dashboard"] as const,
  detail: (franchiseId: AdminDashboardFranchiseFilter) =>
    [...financeDashboardKeys.all, franchiseId] as const,
};

export function useAdminFinanceDashboard(
  franchiseId: AdminDashboardFranchiseFilter = null
) {
  return useQuery({
    queryKey: financeDashboardKeys.detail(franchiseId),
    queryFn: () => financeDashboardService.get(franchiseId),
  });
}
