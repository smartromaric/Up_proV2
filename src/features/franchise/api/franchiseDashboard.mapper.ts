import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";
import type { ApiV1FranchiseDetailResponse } from "@/features/network/api/adminFranchises.api.types";
import type {
  ApiV1FranchiseDriversResponse,
  ApiV1FranchisePartnersResponse,
  ApiV1FranchiseRevenueResponse,
} from "@/features/network/api/adminFranchises.api.types";
import { mapAdminPartnerItemToPartner } from "@/features/network/api/adminPartners.mapper";
import type { FranchiseDashboard } from "./dashboard.service";

const EMPTY_WITHDRAWALS: FranchiseDashboard["pending_withdrawals"] = {
  total_fcfa: 0,
  partners_fcfa: 0,
  partners_requests_count: 0,
  drivers_fcfa: 0,
  drivers_requests_count: 0,
};

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asPartnerStatus(
  value: unknown
): FranchiseDashboard["recent_partners"][number]["status"] {
  if (value === "active" || value === "pending" || value === "suspended") {
    return value;
  }
  return "pending";
}

const DEFAULT_TERRITORY_LABEL = "Territoire";

function resolveTerritoryName(source: Record<string, unknown>): string {
  const territory =
    source.territory_name ??
    source.territoryName ??
    source.franchiseName ??
    source.name;
  if (typeof territory === "string" && territory.trim()) {
    return territory.trim();
  }
  return DEFAULT_TERRITORY_LABEL;
}

function isNativeFranchiseDashboardPayload(
  root: Record<string, unknown>,
  source: Record<string, unknown>
): boolean {
  if (root.status === "error") return false;
  if (root.status === "ok" && root.dashboard != null) return true;
  return (
    source.franchiseId != null ||
    source.partners != null ||
    source.partners_count != null ||
    source.partnersCount != null ||
    source.drivers != null ||
    source.territory_name != null ||
    source.territoryName != null
  );
}

/** Mappe GET /v1/franchise/dashboard vers le modèle UI (null → fallback composé). */
export function mapNativeFranchiseDashboard(
  payload: unknown
): FranchiseDashboard | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  if (root.status === "error") return null;

  const source =
    root.dashboard && typeof root.dashboard === "object"
      ? (root.dashboard as Record<string, unknown>)
      : root;

  if (!isNativeFranchiseDashboardPayload(root, source)) return null;

  const territory_name = resolveTerritoryName(source);
  const ridesToday = asNumber(source.rides);
  const deliveriesToday = asNumber(source.deliveries);

  const withdrawalsRaw = source.pending_withdrawals ?? source.pendingWithdrawals;
  const withdrawals =
    withdrawalsRaw && typeof withdrawalsRaw === "object"
      ? {
          total_fcfa: asNumber(
            (withdrawalsRaw as Record<string, unknown>).total_fcfa ??
              (withdrawalsRaw as Record<string, unknown>).totalFcfa
          ),
          partners_fcfa: asNumber(
            (withdrawalsRaw as Record<string, unknown>).partners_fcfa ??
              (withdrawalsRaw as Record<string, unknown>).partnersFcfa
          ),
          partners_requests_count: asNumber(
            (withdrawalsRaw as Record<string, unknown>).partners_requests_count ??
              (withdrawalsRaw as Record<string, unknown>).partnersRequestsCount
          ),
          drivers_fcfa: asNumber(
            (withdrawalsRaw as Record<string, unknown>).drivers_fcfa ??
              (withdrawalsRaw as Record<string, unknown>).driversFcfa
          ),
          drivers_requests_count: asNumber(
            (withdrawalsRaw as Record<string, unknown>).drivers_requests_count ??
              (withdrawalsRaw as Record<string, unknown>).driversRequestsCount
          ),
        }
      : EMPTY_WITHDRAWALS;

  const chartRaw = source.chart_flux ?? source.chartFlux;
  const chart_flux = Array.isArray(chartRaw)
    ? chartRaw.map((point) => {
        const row = point as Record<string, unknown>;
        return {
          day: String(row.day ?? ""),
          revenue: asNumber(row.revenue),
          trips: asNumber(row.trips),
        };
      })
    : [];

  const partnersRaw = source.recent_partners ?? source.recentPartners;
  const recent_partners = Array.isArray(partnersRaw)
    ? partnersRaw.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: asNumber(row.id),
          name: String(row.name ?? row.trade_name ?? row.tradeName ?? "Partenaire"),
          drivers_count: asNumber(row.drivers_count ?? row.driversCount),
          status: asPartnerStatus(row.status),
        };
      })
    : [];

  const tripsToday = asNumber(
    source.trips_today ??
      source.tripsToday ??
      (ridesToday + deliveriesToday > 0 ? ridesToday + deliveriesToday : undefined)
  );

  return {
    territory_name,
    partners_count: asNumber(
      source.partners_count ?? source.partnersCount ?? source.partners
    ),
    drivers_total: asNumber(
      source.drivers_total ?? source.driversTotal ?? source.drivers
    ),
    drivers_online: asNumber(source.drivers_online ?? source.driversOnline),
    trips_today: tripsToday,
    trips_today_trend_pct: asNumber(
      source.trips_today_trend_pct ?? source.tripsTodayTrendPct
    ),
    trips_completed_today: asNumber(
      source.trips_completed_today ?? source.tripsCompletedToday
    ),
    revenue_today_fcfa: asNumber(
      source.revenue_today_fcfa ??
        source.revenueTodayFcfa ??
        source.revenueTodayXof
    ),
    revenue_trend_pct: asNumber(
      source.revenue_trend_pct ?? source.revenueTrendPct
    ),
    pending_kyc: asNumber(source.pending_kyc ?? source.pendingKyc),
    pending_withdrawals: withdrawals,
    chart_flux,
    recent_partners,
  };
}

function trendToPercent(
  comparison?: { value?: number; direction?: string } | null
): number {
  if (!comparison?.value) return 0;
  const sign = comparison.direction === "down" ? -1 : 1;
  return sign * comparison.value;
}

function seriesValues(
  series: { key: string; values: number[] }[],
  key: string
): number[] {
  return series.find((s) => s.key === key)?.values ?? [];
}

/** Compose le dashboard franchise depuis routes v1 existantes. */
export function mapComposedFranchiseDashboard(
  profile: ApiV1FranchiseDetailResponse,
  dashboard: ApiAdminDashboardResponse,
  partners: ApiV1FranchisePartnersResponse,
  drivers: ApiV1FranchiseDriversResponse,
  _revenue: ApiV1FranchiseRevenueResponse
): FranchiseDashboard {
  const d = dashboard.dashboard;
  const summary = d.summary;
  const revenueSeries = seriesValues(summary.weeklyFlow.series, "revenue");
  const ridesSeries = seriesValues(summary.weeklyFlow.series, "rides");

  const chart_flux = summary.weeklyFlow.labels.map((day, i) => ({
    day,
    revenue: revenueSeries[i] ?? 0,
    trips: ridesSeries[i] ?? 0,
  }));

  const partnerItems = partners.items ?? [];
  const recent_partners = partnerItems.slice(0, 5).map((p) => {
    const row = mapAdminPartnerItemToPartner({
      id: p.id,
      franchise_id: p.franchise_id,
      legal_name: p.legal_name,
      trade_name: p.trade_name,
      name:
        p.trade_name?.trim() ||
        p.legal_name?.trim() ||
        `Partenaire ${p.id.slice(0, 8)}`,
      city_id: p.city_id,
      contact_phone: p.contact_phone,
      contact_email: p.contact_email,
      status: p.status,
      driversCount: 0,
    });
    return {
      id: row.id as unknown as number,
      name: row.name,
      drivers_count: row.drivers_count,
      status: row.status,
    };
  });

  const withdrawalsPending = d.finance.withdrawalsPending ?? 0;

  return {
    territory_name:
      profile.franchise.name?.trim() ||
      profile.franchise.legal_name?.trim() ||
      "Territoire",
    partners_count: partners.pagination?.total ?? partnerItems.length,
    drivers_total: drivers.pagination?.total ?? summary.drivers.total,
    drivers_online:
      summary.drivers.onlineNow ??
      summary.networkActivity.driversOnline ??
      0,
    trips_today: summary.ridesToday.total,
    trips_today_trend_pct: trendToPercent(summary.ridesToday.vsYesterday),
    trips_completed_today: summary.ridesBreakdownToday.completed,
    revenue_today_fcfa: d.finance.revenueTodayXof,
    revenue_trend_pct: trendToPercent(summary.ridesToday.vsPreviousPeriod),
    pending_kyc: summary.kyc.pendingReview,
    pending_withdrawals: {
      total_fcfa: withdrawalsPending,
      partners_fcfa: 0,
      partners_requests_count: 0,
      drivers_fcfa: 0,
      drivers_requests_count: 0,
    },
    chart_flux,
    recent_partners,
  };
}
