"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { LiveMapCanvas } from "@/features/ops/components/LiveMapCanvas";
import { LiveMapStatsBar } from "@/features/ops/components/LiveMapStatsBar";
import { LiveMapDriversPanel } from "@/features/ops/components/LiveMapDriversPanel";
import { FranchiseLiveMapPartnerFilter } from "../components/FranchiseLiveMapPartnerFilter";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";
import { useFranchiseLiveMap } from "../api/liveMap.queries";
import { MapPageSkeleton } from "@/shared/ui/skeletons";

export function FranchiseLiveMapPage() {
  const [filters, setFilters] = useState<FranchiseLiveMapFiltersValue>({
    partnerId: null,
  });
  const { data, isLoading, isError, dataUpdatedAt } = useFranchiseLiveMap(filters);

  const breadcrumb = useMemo(() => {
    const base = ["Franchise", "Carte live"];
    if (filters.partnerId && data?.zone_name) return [...base, data.zone_name];
    return [...base, data?.zone_name ?? "Territoire"];
  }, [filters.partnerId, data?.zone_name]);

  if (isLoading) return <MapPageSkeleton />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger la carte live.{" "}
        <Link href="/franchise/map" className="text-teal underline">
          Réessayer
        </Link>
      </p>
    );
  }

  const updated = new Date(dataUpdatedAt).toLocaleTimeString("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const driverCount = data.drivers?.length ?? 0;
  const onlineCount = data.drivers?.filter((d: { availability: string }) => d.availability === "online").length ?? 0;

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Carte live — Territoire"
          breadcrumb={breadcrumb}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy/8 px-3 py-1 text-xs font-medium text-muted">
                MAJ {updated} · refresh 30s
              </span>
              <Link href="/franchise/drivers">
                <Button variant="secondary">Liste chauffeurs</Button>
              </Link>
            </div>
          }
        />
        <p className="mt-1 text-sm text-muted">
          {driverCount} chauffeur{driverCount > 1 ? "s" : ""} · {onlineCount} en ligne · {data.zone_name ?? "Territoire"}
        </p>
      </div>

      <p className="mb-4 max-w-3xl text-sm text-muted">
        Chauffeurs en temps réel sur votre territoire. Filtrez par partenaire pour
        affiner la carte et la liste, comme sur la vue admin.
      </p>

      {data.filter_options && (
        <FranchiseLiveMapPartnerFilter
          options={data.filter_options}
          value={filters}
          onChange={setFilters}
        />
      )}

      <div className="animate-stagger grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <LiveMapStatsBar stats={data.stats} />
          <LiveMapCanvas data={data} />
        </div>
        <LiveMapDriversPanel data={data} franchiseDriverLinks />
      </div>
    </div>
  );
}
