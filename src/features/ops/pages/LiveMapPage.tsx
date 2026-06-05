"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { useLiveMapWithRealtime } from "../hooks/useLiveMapWithRealtime";
import { LiveMapCanvas } from "../components/LiveMapCanvas";
import { LiveMapStatsBar } from "../components/LiveMapStatsBar";
import { LiveMapDriversPanel } from "../components/LiveMapDriversPanel";
import { LiveMapScopeFilters } from "../components/LiveMapScopeFilters";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import { MapPageSkeleton } from "@/shared/ui/skeletons";

export function LiveMapPage() {
  const [filters, setFilters] = useState<LiveMapScopeFiltersValue>({
    franchiseId: null,
    partnerId: null,
  });

  const {
    data,
    isLoading,
    isError,
    dataUpdatedAt,
    socketStatus,
    realtimeActive,
    httpPollingActive,
  } = useLiveMapWithRealtime(filters);

  const breadcrumb = useMemo(() => {
    const base = ["Admin", "Opérations", "Carte live"];
    if (filters.partnerId && data?.zone_name) return [...base, data.zone_name];
    if (filters.franchiseId && data?.zone_name) return [...base, data.zone_name];
    return [...base, "Vue mondiale"];
  }, [filters, data?.zone_name]);

  if (isLoading) return <MapPageSkeleton />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte.</p>
    );
  }

  const updated = new Date(dataUpdatedAt).toLocaleTimeString("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Carte live — Réseau mondial"
        breadcrumb={breadcrumb}
        actions={
          <span className="flex flex-wrap items-center gap-2">
            {realtimeActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Temps réel actif
              </span>
            ) : socketStatus === "connecting" ? (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-800">
                Connexion temps réel…
              </span>
            ) : socketStatus === "error" || socketStatus === "disconnected" ? (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700">
                Temps réel indisponible · snapshot {updated}
              </span>
            ) : null}
            <span className="rounded-full bg-navy/8 px-3 py-1 text-xs font-medium text-muted">
              MAJ {updated}
              {httpPollingActive ? " · refresh 30s" : " · positions via socket"}
            </span>
          </span>
        }
      />

      <p className="mb-4 max-w-3xl text-sm text-muted">
        Tous les chauffeurs en ligne sur le réseau. Les halos orange/rouge indiquent
        les zones chaudes (surge). Zoomez par pays (franchise) puis par partenaire pour
        affiner la carte et la liste.
      </p>

      {data.filter_options && (
        <div className="mb-4">
          <LiveMapScopeFilters
            options={data.filter_options}
            value={filters}
            onChange={(next) => {
              setFilters(next);
            }}
          />
        </div>
      )}

      <div className="animate-stagger grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <LiveMapStatsBar stats={data.stats} />
          <LiveMapCanvas data={data} scopeFilters={filters} />
        </div>
        <LiveMapDriversPanel data={data} adminDriverLinks />
      </div>
    </div>
  );
}
