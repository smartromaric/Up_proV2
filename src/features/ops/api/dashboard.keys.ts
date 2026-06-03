import type { AdminDashboardFranchiseFilter } from "./dashboard.types";

export const dashboardKeys = {
  all: ["ops", "dashboard"] as const,
  admin: (franchiseId?: AdminDashboardFranchiseFilter) =>
    [...dashboardKeys.all, "admin", franchiseId ?? "all"] as const,
};
