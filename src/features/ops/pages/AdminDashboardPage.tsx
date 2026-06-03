"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useAdminDashboard } from "../api/dashboard.queries";
import { HeroKpi } from "../components/HeroKpi";
import { ChartFlux } from "../components/ChartFlux";
import { RecentTripsTable } from "../components/RecentTripsTable";
import { AdminNetworkActivityPanel } from "../components/AdminNetworkActivityPanel";
import { AdminDashboardFranchiseSelect } from "../components/AdminDashboardFranchiseSelect";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 rounded-hero bg-navy/10" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-card bg-gradient-to-br from-navy/10 via-teal/10 to-border animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [franchiseId, setFranchiseId] = useState<number | null>(null);
  const { data, isLoading, isError, isFetching } = useAdminDashboard(franchiseId);

  const scopeLabel =
    franchiseId === null
      ? "Toutes les franchises"
      : data?.franchise_options.find((f) => f.id === franchiseId)?.name ??
        "Franchise";

  if (isLoading && !data) return <DashboardSkeleton />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger le tableau de bord.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tableau de bord"
        breadcrumb={["Admin", "Opérations", scopeLabel]}
        actions={
          <AdminDashboardFranchiseSelect
            options={data.franchise_options}
            value={franchiseId}
            onChange={setFranchiseId}
            disabled={isFetching}
          />
        }
      />

      {franchiseId !== null && (
        <p className="mb-4 text-sm text-muted">
          Chiffres filtrés pour{" "}
          <span className="font-medium text-foreground">{scopeLabel}</span>.
          Sélectionnez « Toutes les franchises » pour la vue globale.
        </p>
      )}

      <div
        className={`animate-stagger space-y-5 ${isFetching ? "opacity-70 transition-opacity" : ""}`}
      >
        <HeroKpi
          amount={data.net_profit_today_fcfa}
          trendPct={data.net_profit_trend_pct}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartFlux data={data.chart_flux} />
          </div>
          <div className="space-y-5">
            <KpiCard
              index={0}
              label="Courses terminées"
              value={String(data.trips_completed_today)}
              hint={`${data.trips_cancelled_today} annulées`}
            />
            <AdminNetworkActivityPanel
              activeZone={data.active_zone}
              franchiseActivity={data.franchise_activity ?? []}
              scopedToFranchise={franchiseId !== null}
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <KpiCard
            index={0}
            label="Chauffeurs approuvés"
            value={`${data.drivers_approved.toLocaleString("fr-CI")} / ${data.drivers_total.toLocaleString("fr-CI")}`}
            hint="approuvés · total plateforme"
          />
          <KpiCard
            index={1}
            label="KYC en attente"
            value={String(data.drivers_pending_kyc)}
            trend={data.drivers_pending_kyc > 0 ? "Action requise" : undefined}
          />
          <KpiCard
            index={2}
            label="Utilisateurs inscrits"
            value={data.users_registered.toLocaleString("fr-CI")}
          />
        </div>

        <RecentTripsTable trips={data.recent_trips} />
      </div>
    </div>
  );
}
