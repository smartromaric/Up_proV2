import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { DashboardPartnerKpi } from "@/shared/types";

interface PartnerDashboardApiResponse {
  status: string;
  generatedAt?: string;
  dashboard: {
    fleetName?: string;
    driversCount?: number;
    driversOnline?: number;
    driversPendingKyc?: number;
    vehiclesCount?: number;
    tripsToday?: number;
    tripsCompletedToday?: number;
    tripsCancelledToday?: number;
    revenueToday?: number;
    revenueTrendPct?: number;
    walletBalance?: number;
    pendingWithdrawal?: number;
    chartFlux?: { day: string; revenue: number; trips: number }[];
    recentTrips?: DashboardPartnerKpi["recent_trips"];
  };
}

function mapApiResponse(raw: PartnerDashboardApiResponse): DashboardPartnerKpi {
  const d = raw.dashboard ?? {};
  return {
    fleet_name: d.fleetName ?? "Ma flotte",
    trips_today: d.tripsToday ?? 0,
    trips_completed_today: d.tripsCompletedToday ?? 0,
    trips_cancelled_today: d.tripsCancelledToday ?? 0,
    drivers_total: d.driversCount ?? 0,
    drivers_online: d.driversOnline ?? 0,
    drivers_pending_kyc: d.driversPendingKyc ?? 0,
    vehicles_total: d.vehiclesCount ?? 0,
    revenue_today_fcfa: d.revenueToday ?? 0,
    revenue_trend_pct: d.revenueTrendPct ?? 0,
    wallet_balance_fcfa: d.walletBalance ?? 0,
    pending_withdrawal_fcfa: d.pendingWithdrawal ?? 0,
    chart_flux: d.chartFlux ?? [],
    recent_trips: d.recentTrips ?? [],
  };
}

export const partnerDashboardService = {
  get: async (partnerId: string | number): Promise<DashboardPartnerKpi> => {
    const raw = await apiClient.get<PartnerDashboardApiResponse>(
      LINKS.partner.dashboard(partnerId)
    );
    return mapApiResponse(raw);
  },
};
