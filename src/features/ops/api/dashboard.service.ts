import { apiClient } from "@/core/http/apiClient";
import { env } from "@/core/config/env";
import { LINKS, createUrl } from "@/core/api/links";
import type { DashboardAdminKpi } from "@/shared/types";
import type { ApiAdminDashboardResponse } from "./dashboard.api.types";
import { mapApiAdminDashboardToKpi } from "./dashboard.mapper";
import type { AdminDashboardFranchiseFilter } from "./dashboard.types";

function useLegacyDashboard(): boolean {
  return env.useMocks && !env.useRealAuth;
}

function buildLegacyQuery(franchiseId?: AdminDashboardFranchiseFilter): string {
  const params = new URLSearchParams();
  if (typeof franchiseId === "number") {
    params.set("franchise_id", String(franchiseId));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function buildV1Endpoint(
  franchiseId?: AdminDashboardFranchiseFilter
): string {
  if (typeof franchiseId === "string" && franchiseId) {
    return createUrl(LINKS.admin.v1.dashboard, { franchiseId });
  }
  return LINKS.admin.v1.dashboard;
}

export const dashboardService = {
  getAdmin: async (
    franchiseId?: AdminDashboardFranchiseFilter
  ): Promise<DashboardAdminKpi> => {
    if (useLegacyDashboard()) {
      return apiClient.get<DashboardAdminKpi>(
        `${LINKS.admin.dashboard}${buildLegacyQuery(franchiseId)}`
      );
    }

    const endpoint = buildV1Endpoint(franchiseId);
    const data = await apiClient.get<ApiAdminDashboardResponse>(endpoint);
    return mapApiAdminDashboardToKpi(data);
  },
};
