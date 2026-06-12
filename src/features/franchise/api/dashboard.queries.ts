"use client";

import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_LIVE_REFETCH_MS } from "@/shared/ui/LiveRefreshIndicator";
import { franchiseDashboardService } from "./dashboard.service";

export const franchiseDashboardKeys = {
  all: ["franchise", "dashboard"] as const,
};

export function useFranchiseDashboard() {
  return useQuery({
    queryKey: franchiseDashboardKeys.all,
    queryFn: () => franchiseDashboardService.get(),
    refetchInterval: DASHBOARD_LIVE_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
}
