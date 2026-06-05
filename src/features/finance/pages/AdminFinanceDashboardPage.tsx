"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { HeroKpi } from "@/features/ops/components/HeroKpi";
import { AdminDashboardFranchiseSelect } from "@/features/ops/components/AdminDashboardFranchiseSelect";
import { formatFCFA, formatPercent } from "@/shared/lib/format";
import { useAdminFinanceDashboard } from "../api/financeDashboard.queries";
import type { AdminDashboardFranchiseFilter } from "@/features/ops/api/dashboard.types";
import { FinanceChartWeekly } from "../components/FinanceChartWeekly";
import { FinanceAlertsPanel } from "../components/FinanceAlertsPanel";
import { FinanceFranchiseBreakdown } from "../components/FinanceFranchiseBreakdown";
import { FinancePaymentMix } from "../components/FinancePaymentMix";
import { FinanceQuickLinks } from "../components/FinanceQuickLinks";
import { FinanceDashboardSkeleton } from "@/shared/ui/skeletons";

function trendHint(pct: number) {
  return `${formatPercent(pct)} vs M-1`;
}

export function AdminFinanceDashboardPage() {
  const [franchiseId, setFranchiseId] =
    useState<AdminDashboardFranchiseFilter>(null);
  const { data, isLoading, isError, isFetching } = useAdminFinanceDashboard(franchiseId);

  const scopeLabel =
    franchiseId === null
      ? "Réseau global"
      : data?.franchise_options.find((f) => f.id === franchiseId)?.name ?? "Franchise";

  if (isLoading && !data) {
    return <FinanceDashboardSkeleton title="Tableau de bord financier" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger le tableau de bord financier.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Finance générale"
        breadcrumb={["Admin", "Finance", scopeLabel]}
        actions={
          <AdminDashboardFranchiseSelect
            options={data.franchise_options}
            value={franchiseId}
            onChange={setFranchiseId}
            disabled={isFetching}
          />
        }
      />

      <div className="mb-4">
        <FinanceQuickLinks />
      </div>

      {franchiseId !== null && (
        <p className="mb-4 text-sm text-muted">
          Indicateurs filtrés pour{" "}
          <span className="font-medium text-foreground">{scopeLabel}</span>.
        </p>
      )}

      <div
        className={`animate-stagger space-y-6 ${isFetching ? "opacity-70 transition-opacity" : ""}`}
      >
        <HeroKpi
          amount={data.gmv_today_fcfa}
          trendPct={data.gmv_today_trend_pct}
          label="GMV aujourd'hui"
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            index={0}
            label="GMV du mois"
            value={formatFCFA(data.gmv_month_fcfa)}
            trend={trendHint(data.gmv_month_trend_pct)}
          />
          <KpiCard
            index={1}
            label="Marge nette (mois)"
            value={formatFCFA(data.net_margin_month_fcfa)}
            trend={trendHint(data.net_margin_trend_pct)}
            hint="Après commissions partenaires & coûts ops"
          />
          <KpiCard
            index={2}
            label="Commissions plateforme"
            value={formatFCFA(data.commissions_month_fcfa)}
            trend={trendHint(data.commissions_trend_pct)}
            hint={`Take rate ${data.take_rate_pct}%`}
          />
          <KpiCard
            index={3}
            label="Trésorerie plateforme"
            value={formatFCFA(data.platform_treasury_fcfa)}
            hint="Solde consolidé disponible"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            index={0}
            label="Retraits en attente"
            value={formatFCFA(data.withdrawals_pending_fcfa)}
            hint={`${data.withdrawals_pending_count} demande(s)`}
          />
          <KpiCard
            index={1}
            label="Taux de recouvrement"
            value={`${data.collection_rate_pct}%`}
            hint="Encaissements / GMV facturé"
          />
          <KpiCard
            index={2}
            label="Panier moyen"
            value={formatFCFA(data.avg_trip_fcfa)}
            hint="Par course terminée"
          />
          <KpiCard
            index={3}
            label="Écart réconciliation"
            value={formatFCFA(data.reconciliation_gap_fcfa)}
            hint={`${data.reconciliation_items_open} ligne(s) ouverte(s)`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            compact
            index={0}
            label="Wallets chauffeurs"
            value={formatFCFA(data.driver_wallets_total_fcfa)}
          />
          <KpiCard
            compact
            index={1}
            label="Wallets partenaires"
            value={formatFCFA(data.partner_wallets_total_fcfa)}
          />
          <KpiCard
            compact
            index={2}
            label="Wallets clients"
            value={formatFCFA(data.client_wallets_total_fcfa)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <FinanceChartWeekly data={data.chart_weekly} />
          <FinanceAlertsPanel alerts={data.alerts} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {franchiseId === null && (
            <FinanceFranchiseBreakdown rows={data.by_franchise} />
          )}
          <FinancePaymentMix items={data.payment_mix} />
        </div>

        <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Mouvements récents</h2>
            <Link
              href="/admin/finance/transactions"
              className="text-xs font-medium text-teal hover:underline"
            >
              Toutes les transactions →
            </Link>
          </div>
          <ul className="divide-y divide-border/50">
            {data.recent_movements.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{tx.label}</p>
                  <p className="text-xs text-muted capitalize">{tx.category}</p>
                </div>
                <p
                  className={`font-semibold tabular-nums ${
                    tx.direction === "credit" ? "text-teal-dark" : "text-red-600"
                  }`}
                >
                  {tx.direction === "credit" ? "+" : "−"}
                  {formatFCFA(tx.amount_fcfa)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
