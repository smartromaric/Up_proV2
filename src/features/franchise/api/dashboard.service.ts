import { apiClient } from "@/core/http/apiClient";

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

export const franchiseDashboardService = {
  get: () => apiClient.get<FranchiseDashboard>("/franchise/dashboard"),
};
