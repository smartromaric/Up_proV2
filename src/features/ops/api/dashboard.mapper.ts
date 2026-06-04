import type {
  DashboardAdminAlert,
  DashboardAdminKpi,
  Trip,
  TripStatus,
} from "@/shared/types";
import type {
  ApiAdminDashboardResponse,
  ApiDashboardRecentActivityItem,
  ApiTrendComparison,
} from "./dashboard.api.types";

const ALERT_HREF: Record<string, string> = {
  "/admin/kyc/pending": "/admin/fleet/kyc",
  "/admin/drivers": "/admin/fleet/drivers",
  "/admin/withdrawals": "/admin/finance/withdrawals",
};

function trendToPercent(comparison?: ApiTrendComparison): number {
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

const SERVICE_MAP: Record<string, Trip["service"]> = {
  RIDE: "taxi",
  TAXI: "taxi",
  DELIVERY: "delivery",
  RENTAL: "rental",
  FREIGHT: "freight",
};

const STATUS_MAP: Record<string, TripStatus> = {
  requested: "requested",
  matching: "matching",
  assigned: "assigned",
  arrived: "arrived",
  in_progress: "in_progress",
  completed: "completed",
  cancelled: "cancelled",
};

function mapRecentTrip(item: ApiDashboardRecentActivityItem): Trip {
  const statusKey = item.status.toLowerCase().replace(/-/g, "_");
  return {
    id: item.id,
    ref: item.ref,
    service: SERVICE_MAP[item.service.toUpperCase()] ?? "taxi",
    from_label: item.route.from,
    to_label: item.route.to,
    client_name: item.client.displayName,
    amount_fcfa: item.amountXof,
    status: STATUS_MAP[statusKey] ?? "requested",
    payment_method: "wallet",
    created_at: item.createdAt,
  };
}

function mapAlerts(
  alerts: ApiAdminDashboardResponse["dashboard"]["alerts"]
): DashboardAdminAlert[] {
  if (!alerts?.length) return [];
  return alerts.map((a) => {
    const raw = a.actionUrl ?? "";
    const href = ALERT_HREF[raw] ?? raw.replace(/^\/admin\//, "/admin/");
    const severity =
      a.severity === "warning" || a.severity === "critical" || a.severity === "info"
        ? a.severity
        : "info";
    return {
      code: a.code,
      severity,
      count: a.count,
      label: a.label,
      href: href.startsWith("/") ? href : `/admin/${href}`,
    };
  });
}

/** Mappe GET /v1/admin/dashboard vers le modèle UI back-office. */
export function mapApiAdminDashboardToKpi(
  response: ApiAdminDashboardResponse
): DashboardAdminKpi {
  const d = response.dashboard;
  const summary = d.summary;
  const network = summary.networkActivity;
  const zoneLabel =
    network.zone?.label ?? network.label ?? "Zone active";
  const revenueSeries = seriesValues(summary.weeklyFlow.series, "revenue");
  const commissionSeries = seriesValues(
    summary.weeklyFlow.series,
    "commissions"
  );

  const chart_flux = summary.weeklyFlow.labels.map((day, i) => ({
    day,
    revenue: revenueSeries[i] ?? 0,
    commission: commissionSeries[i] ?? 0,
  }));

  return {
    selected_franchise_id: null,
    franchise_options: [],
    net_profit_today_fcfa: d.finance.revenueTodayXof,
    net_profit_trend_pct: trendToPercent(summary.ridesToday.vsYesterday),
    trips_today: summary.ridesToday.total,
    trips_today_trend_pct: trendToPercent(summary.ridesToday.vsYesterday),
    trips_completed_today: summary.ridesBreakdownToday.completed,
    trips_in_progress_today: summary.ridesBreakdownToday.inProgress,
    trips_cancelled_today: summary.ridesBreakdownToday.cancelled,
    drivers_approved: summary.drivers.approved,
    drivers_total: summary.drivers.total,
    drivers_pending_kyc: summary.kyc.pendingReview,
    users_registered: summary.users.totalRegistered,
    clients_ordered_today: summary.users.clientsActiveToday,
    chart_flux,
    recent_trips: d.recentActivity.items.map(mapRecentTrip),
    active_zone: {
      franchise_id: 0,
      franchise_name: network.label ?? zoneLabel,
      partner_id: 0,
      partner_name: "",
      zone_id: 0,
      zone_name: zoneLabel,
      city: zoneLabel,
      trips_24h: network.ridesLast24h,
      drivers_online: network.driversOnline,
    },
    franchise_activity: [],
    alerts: mapAlerts(d.alerts),
  };
}
