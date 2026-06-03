"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./dashboard.keys";
import { dashboardService } from "./dashboard.service";
import type { AdminDashboardFranchiseFilter } from "./dashboard.types";

export function useAdminDashboard(
  franchiseId: AdminDashboardFranchiseFilter = null
) {
  return useQuery({
    queryKey: dashboardKeys.admin(franchiseId),
    queryFn: () => dashboardService.getAdmin(franchiseId),
  });
}
