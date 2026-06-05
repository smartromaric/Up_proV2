import { apiClient } from "@/core/http/apiClient";
import type { AdminDashboardFranchiseFilter } from "@/features/ops/api/dashboard.types";
import type { AdminFinanceDashboard } from "@/shared/types";

export const financeDashboardService = {
  get: (franchiseId?: AdminDashboardFranchiseFilter) => {
    const qs =
      franchiseId != null ? `?franchise_id=${franchiseId}` : "";
    return apiClient.get<AdminFinanceDashboard>(
      `/admin/finance/dashboard${qs}`
    );
  },
};
