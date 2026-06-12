"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { DASHBOARD_LIVE_REFETCH_MS } from "@/shared/ui/LiveRefreshIndicator";
import { partnerDashboardService } from "./dashboard.service";

export const partnerDashboardKeys = {
  all: (partnerId: string | number) => ["partner", "dashboard", partnerId] as const,
};

export function usePartnerDashboard() {
  const { ownerId } = useScope();

  return useQuery({
    queryKey: partnerDashboardKeys.all(ownerId ?? ""),
    queryFn: () => partnerDashboardService.get(ownerId!),
    enabled: ownerId != null,
    refetchInterval: DASHBOARD_LIVE_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
}
