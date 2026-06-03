import { http, HttpResponse } from "msw";
import adminDashboard from "../data/dashboard-admin.json";
import { zonesState } from "./network-state";
import { DRIVERS_CATALOG, filterDrivers } from "../lib/driversCatalog";
import { paginatedList, parseListQuery } from "../lib/listQuery";

export const dashboardHandlers = [
  http.get("*/api/v2/admin/dashboard", () => {
    return HttpResponse.json(adminDashboard);
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
