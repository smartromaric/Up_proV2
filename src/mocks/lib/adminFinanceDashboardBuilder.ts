import financeDashboardSeed from "../data/finance-dashboard-admin.json";
import type { AdminFinanceDashboard } from "@/shared/types";

const GLOBAL = financeDashboardSeed as AdminFinanceDashboard;

const FRANCHISE_SCALE: Record<number, number> = {
  1: 0.39,
  2: 0.23,
  3: 0.33,
  4: 0.05,
};

function scale(n: number, factor: number) {
  return Math.round(n * factor);
}

function buildForFranchise(franchiseId: number): AdminFinanceDashboard {
  const factor = FRANCHISE_SCALE[franchiseId] ?? 0.25;
  const franchise = GLOBAL.by_franchise.find((f) => f.franchise_id === franchiseId);
  const name = franchise?.franchise_name ?? "Franchise";

  return {
    ...GLOBAL,
    selected_franchise_id: franchiseId,
    gmv_today_fcfa: scale(GLOBAL.gmv_today_fcfa, factor * 1.1),
    gmv_month_fcfa: franchise?.gmv_month_fcfa ?? scale(GLOBAL.gmv_month_fcfa, factor),
    net_margin_month_fcfa: franchise?.margin_fcfa ?? scale(GLOBAL.net_margin_month_fcfa, factor),
    commissions_month_fcfa: scale(GLOBAL.commissions_month_fcfa, factor),
    platform_treasury_fcfa: scale(GLOBAL.platform_treasury_fcfa, factor * 0.9),
    withdrawals_pending_fcfa: scale(GLOBAL.withdrawals_pending_fcfa, factor),
    withdrawals_pending_count: Math.max(1, Math.round(GLOBAL.withdrawals_pending_count * factor)),
    driver_wallets_total_fcfa: scale(GLOBAL.driver_wallets_total_fcfa, factor),
    partner_wallets_total_fcfa: scale(GLOBAL.partner_wallets_total_fcfa, factor),
    client_wallets_total_fcfa: scale(GLOBAL.client_wallets_total_fcfa, factor),
    reconciliation_gap_fcfa: scale(GLOBAL.reconciliation_gap_fcfa, factor),
    chart_weekly: GLOBAL.chart_weekly.map((d) => ({
      day: d.day,
      gmv: scale(d.gmv, factor),
      commissions: scale(d.commissions, factor),
      payouts: scale(d.payouts, factor),
    })),
    by_franchise: GLOBAL.by_franchise.filter((f) => f.franchise_id === franchiseId),
    payment_mix: GLOBAL.payment_mix.map((p) => ({
      ...p,
      amount_fcfa: scale(p.amount_fcfa, factor),
    })),
    alerts: GLOBAL.alerts.map((a) => ({
      ...a,
      description: a.description.replace(/plateforme/gi, name),
    })),
    recent_movements: GLOBAL.recent_movements.slice(0, 3),
  };
}

export function buildAdminFinanceDashboard(
  franchiseId: number | null
): AdminFinanceDashboard {
  if (franchiseId == null) {
    return { ...GLOBAL, selected_franchise_id: null };
  }
  return buildForFranchise(franchiseId);
}
