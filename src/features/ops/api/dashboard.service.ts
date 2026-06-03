import { apiClient } from "@/core/http/apiClient";
import type { DashboardAdminKpi } from "@/shared/types";
import type { AdminDashboardFranchiseFilter } from "./dashboard.types";

export const dashboardService = {
  getAdmin: (franchiseId?: AdminDashboardFranchiseFilter) => {
    const params = new URLSearchParams();
    if (franchiseId != null) {
      params.set("franchise_id", String(franchiseId));
    }
    const qs = params.toString();
    return apiClient.get<DashboardAdminKpi>(
      `/admin/dashboard${qs ? `?${qs}` : ""}`
    );
  },
};
