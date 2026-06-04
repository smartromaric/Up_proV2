import { http, HttpResponse } from "msw";
import { buildAdminDashboard } from "../lib/adminDashboardBuilder";
import dashboardAdminV1 from "../data/dashboard-admin-v1.json";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";
import { zonesState } from "./network-state";
import { DRIVERS_CATALOG, filterDrivers } from "../lib/driversCatalog";
import { paginatedList, parseListQuery } from "../lib/listQuery";

export const dashboardHandlers = [
  http.get("*/v1/admin/dashboard", () => {
    const payload = dashboardAdminV1 as ApiAdminDashboardResponse;
    return HttpResponse.json(payload);
  }),

  http.get("*/api/v2/admin/dashboard", ({ request }) => {
    const url = new URL(request.url);
    const raw = url.searchParams.get("franchise_id");
    const franchiseId = raw ? Number(raw) : null;
    return HttpResponse.json(
      buildAdminDashboard(Number.isFinite(franchiseId) ? franchiseId : null)
    );
  }),

  http.get("*/api/v2/admin/drivers", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterDrivers(DRIVERS_CATALOG, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/network/zones", () => {
    return HttpResponse.json(zonesState);
  }),
];
