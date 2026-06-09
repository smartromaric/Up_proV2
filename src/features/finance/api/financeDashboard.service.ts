import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { AdminDashboardFranchiseFilter } from "@/features/ops/api/dashboard.types";
import type { AdminFinanceDashboard } from "@/shared/types";
import type { ApiFinanceDashboardResponse } from "./adminFinance.api.types";
import { mapFinanceDashboardResponse } from "./adminFinance.mapper";

export const financeDashboardService = {
  get: async (franchiseId?: AdminDashboardFranchiseFilter) => {
    if (useLegacyAdminApi()) {
      const qs =
        franchiseId != null ? `?franchise_id=${franchiseId}` : "";
      return apiClient.get<AdminFinanceDashboard>(
        `/admin/finance/dashboard${qs}`
      );
    }

    const qs =
      franchiseId != null ? `?franchise_id=${encodeURIComponent(String(franchiseId))}` : "";
    const response = await apiClient.get<ApiFinanceDashboardResponse>(
      `${LINKS.admin.v1.finance.dashboard}${qs}`
    );
    return mapFinanceDashboardResponse(
      response,
      franchiseId != null ? String(franchiseId) : null
    );
  },
};
