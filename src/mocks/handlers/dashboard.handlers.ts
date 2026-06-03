import { http, HttpResponse } from "msw";
import { buildAdminDashboard } from "../lib/adminDashboardBuilder";
import { zonesState } from "./network-state";
import { DRIVERS_CATALOG, filterDrivers } from "../lib/driversCatalog";
import { paginatedList, parseListQuery } from "../lib/listQuery";

export const dashboardHandlers = [
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
