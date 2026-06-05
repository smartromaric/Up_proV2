/** GET /v1/admin/dashboard — Swagger § 10 - Admin */

export interface ApiTrendComparison {
  value: number;
  direction: "up" | "down" | string;
  unit?: string;
}

export interface ApiDashboardRecentActivityItem {
  id: string;
  ref: string;
  service: string;
  route: { from: string; to: string };
  client: { id: string; displayName: string; type?: string };
  amountXof: number;
  currency?: string;
  status: string;
  statusLabel?: string;
  createdAt: string;
}

export interface ApiDashboardAlert {
  code: string;
  severity: "info" | "warning" | "critical" | string;
  count: number;
  label: string;
  actionUrl?: string;
}

export interface ApiDashboardFilterFranchise {
  id: string;
  name: string;
  city?: string | null;
}

export interface ApiDashboardFilterPartner {
  id: string;
  name: string;
  franchiseId?: string | null;
}

export interface ApiAdminDashboardPayload {
  generatedAt?: string;
  filters?: {
    applied?: {
      franchiseId?: string | null;
      partnerId?: string | null;
      cityId?: string | null;
    };
    options?: {
      franchises?: ApiDashboardFilterFranchise[];
      partners?: ApiDashboardFilterPartner[];
    };
  };
  summary: {
    ridesToday: {
      total: number;
      label?: string;
      vsYesterday?: ApiTrendComparison;
      vsPreviousPeriod?: ApiTrendComparison;
    };
    weeklyFlow: {
      labels: string[];
      series: { key: string; label: string; values: number[] }[];
      unit?: string;
    };
    ridesBreakdownToday: {
      inProgress: number;
      completed: number;
      cancelled: number;
      total: number;
    };
    networkActivity: {
      zone?: { id?: string; label?: string; code?: string; ridesLast24h?: number };
      driversOnline: number;
      ridesLast24h: number;
      label?: string;
    };
    drivers: {
      approved: number;
      total: number;
      pendingApproval?: number;
      onlineNow?: number;
    };
    kyc: {
      pendingReview: number;
      actionRequired?: number;
    };
    users: {
      totalRegistered: number;
      clientsActiveToday: number;
    };
  };
  finance: {
    revenueTodayXof: number;
    commissionsTodayXof: number;
    withdrawalsPending?: number;
    currency?: string;
  };
  recentActivity: {
    items: ApiDashboardRecentActivityItem[];
    pagination?: Record<string, unknown>;
  };
  alerts?: ApiDashboardAlert[];
  legacy?: Record<string, number>;
}

export interface ApiAdminDashboardResponse {
  status: string;
  generatedAt?: string;
  dashboard: ApiAdminDashboardPayload;
}
