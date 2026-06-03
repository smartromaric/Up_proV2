"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { LiveMapCanvas } from "@/features/ops/components/LiveMapCanvas";
import { useDispatchPortalLiveMap } from "../api/dispatchPortal.queries";
import type { LiveMapDriver } from "@/shared/types";

function DriverRow({ driver }: { driver: LiveMapDriver }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/50 py-3 first:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#212529]">{driver.name}</p>
        <p className="truncate text-xs text-muted">{driver.vehicle}</p>
      </div>
      <AvailabilityPill status={driver.availability} />
    </div>
  );
}

export function DispatchLiveMapPage() {
  const { data, isLoading, isError } = useDispatchPortalLiveMap();

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte live.</p>
    );
  }

  const online = data.drivers.filter((d) => d.availability === "online").length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Carte live"
        breadcrumb={["Dispatch", "Carte"]}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Chauffeurs visibles" value={String(data.drivers.length)} />
        <KpiCard label="En ligne" value={String(online)} />
        <KpiCard label="Zone" value={data.zone_name} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <LiveMapCanvas data={data} />
        <aside className="rounded-card border border-border bg-surface p-4 shadow-card">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Chauffeurs
          </h2>
          <div className="mt-2 max-h-[min(520px,70vh)] overflow-y-auto">
            {data.drivers.map((d) => (
              <DriverRow key={d.id} driver={d} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
