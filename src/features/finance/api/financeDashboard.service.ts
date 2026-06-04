import { apiClient } from "@/core/http/apiClient";
import type { AdminFinanceDashboard } from "@/shared/types";

export const financeDashboardService = {
  get: (franchiseId?: number | null) => {
    const qs =
      franchiseId != null ? `?franchise_id=${franchiseId}` : "";
    return apiClient.get<AdminFinanceDashboard>(
      `/admin/finance/dashboard${qs}`
    );
  },
};
