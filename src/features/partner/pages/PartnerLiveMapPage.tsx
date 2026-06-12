"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { LiveMapCanvas } from "@/features/ops/components/LiveMapCanvas";
import { LiveMapStatsBar } from "@/features/ops/components/LiveMapStatsBar";
import { LiveMapDriversPanel } from "@/features/ops/components/LiveMapDriversPanel";
import { usePartnerLiveMap } from "../api/partnerDriverDetail.queries";
import { MapPageSkeleton } from "@/shared/ui/skeletons";

export function PartnerLiveMapPage() {
  const { data, isLoading, isError, dataUpdatedAt } = usePartnerLiveMap();

  if (isLoading) return <MapPageSkeleton showStatsBar={false} />;
  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte live.</p>
    );
  }

  const updated = new Date(dataUpdatedAt).toLocaleTimeString("fr-CI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Carte live — Ma flotte"
        breadcrumb={["Partenaire", "Carte live"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy/8 px-3 py-1 text-xs font-medium text-muted">
              MAJ {updated} · refresh 30s
            </span>
            <Link href="/partner/drivers">
              <Button variant="secondary">Liste chauffeurs</Button>
            </Link>
          </div>
        }
      />

      <p className="mb-4 max-w-2xl text-sm text-muted">
        Suivez en temps réel la position et la disponibilité de vos chauffeurs.
        Cliquez sur un nom dans la liste pour ouvrir sa fiche.
      </p>

      <div className="animate-stagger grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <LiveMapStatsBar stats={data.stats} />
          <LiveMapCanvas data={data} />
        </div>
        <LiveMapDriversPanel data={data} partnerDriverLinks />
      </div>
    </div>
  );
}
