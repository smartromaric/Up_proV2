import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, createUrl } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";
import type {
  ApiV1FranchiseDetailResponse,
  ApiV1FranchiseDriversResponse,
  ApiV1FranchisePartnersResponse,
  ApiV1FranchiseRevenueResponse,
} from "@/features/network/api/adminFranchises.api.types";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import {
  mapComposedFranchiseDashboard,
  mapNativeFranchiseDashboard,
} from "./franchiseDashboard.mapper";

export interface FranchiseDashboard {
  territory_name: string;
  partners_count: number;
  drivers_total: number;
  drivers_online: number;
  trips_today: number;
  trips_today_trend_pct: number;
  trips_completed_today: number;
  revenue_today_fcfa: number;
  revenue_trend_pct: number;
  pending_kyc: number;
  pending_withdrawals: {
    total_fcfa: number;
    partners_fcfa: number;
    partners_requests_count: number;
    drivers_fcfa: number;
    drivers_requests_count: number;
  };
  chart_flux: { day: string; revenue: number; trips: number }[];
  recent_partners: {
    id: number;
    name: string;
    drivers_count: number;
    status: "active" | "pending" | "suspended";
  }[];
}

async function fetchComposedFranchiseDashboard(
  franchiseId: string
): Promise<FranchiseDashboard> {
  const [profile, dashboard, partners, drivers, revenue] = await Promise.all([
    apiClient.get<ApiV1FranchiseDetailResponse>(
      LINKS.admin.franchises.getById(franchiseId)
    ),
    apiClient.get<ApiAdminDashboardResponse>(
      createUrl(LINKS.admin.v1.dashboard, { franchiseId })
    ),
    apiClient.get<ApiV1FranchisePartnersResponse>(
      `${LINKS.admin.franchises.partners(franchiseId)}${buildV1ListQuery({ page: 1, per_page: 5 })}`
    ),
    apiClient.get<ApiV1FranchiseDriversResponse>(
      `${LINKS.admin.franchises.drivers(franchiseId)}${buildV1ListQuery({ page: 1, per_page: 1 })}`
    ),
    apiClient.get<ApiV1FranchiseRevenueResponse>(
      LINKS.admin.franchises.revenue(franchiseId)
    ),
  ]);

  return mapComposedFranchiseDashboard(
    profile,
    dashboard,
    partners,
    drivers,
    revenue
  );
}

const FRANCHISE_DASHBOARD_FALLBACK_CODES = new Set([
  "FRANCHISE_NOT_FOUND",
  "DASHBOARD_COUNT_FAILED",
]);

function shouldFallbackFranchiseDashboard(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  if (error.status === 401 || error.status === 403) return false;
  if (error.code && FRANCHISE_DASHBOARD_FALLBACK_CODES.has(error.code)) {
    return true;
  }
  return error.status === 404 || error.status >= 500;
}

async function enrichTerritoryName(
  dashboard: FranchiseDashboard,
  franchiseId: string
): Promise<FranchiseDashboard> {
  if (dashboard.territory_name !== "Territoire") return dashboard;

  try {
    const profile = await apiClient.get<ApiV1FranchiseDetailResponse>(
      LINKS.admin.franchises.getById(franchiseId)
    );
    const name =
      profile.franchise?.name?.trim() ||
      profile.franchise?.legal_name?.trim();
    if (name) return { ...dashboard, territory_name: name };
  } catch {
    // Garde le libellé par défaut
  }

  return dashboard;
}

async function fetchDashboardV1(): Promise<FranchiseDashboard> {
  const franchiseId = await resolveFranchiseId();

  try {
    const native = await apiClient.get<unknown>(LINKS.franchise.v1.dashboard);
    const mapped = mapNativeFranchiseDashboard(native);
    if (mapped) return enrichTerritoryName(mapped, franchiseId);
  } catch (error) {
    if (!shouldFallbackFranchiseDashboard(error)) throw error;
  }

  return fetchComposedFranchiseDashboard(franchiseId);
}

export const franchiseDashboardService = {
  get: () =>
    useLegacyPortalApi()
      ? apiClient.get<FranchiseDashboard>(LINKS.franchise.dashboard)
      : fetchDashboardV1(),
};
