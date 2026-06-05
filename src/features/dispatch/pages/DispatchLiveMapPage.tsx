"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { LiveMapCanvas } from "@/features/ops/components/LiveMapCanvas";
import { LiveMapStatsBar } from "@/features/ops/components/LiveMapStatsBar";
import { LiveMapDriversPanel } from "@/features/ops/components/LiveMapDriversPanel";
import { useDispatchPortalLiveMap } from "../api/dispatchPortal.queries";
import { MapPageSkeleton } from "@/shared/ui/skeletons";

export function DispatchLiveMapPage() {
  const { data, isLoading, isError } = useDispatchPortalLiveMap();

  if (isLoading) {
    return <MapPageSkeleton showStatsBar={false} />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la carte live.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Carte live" breadcrumb={["Dispatch", "Carte"]} />

      <div className="animate-stagger grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <LiveMapStatsBar stats={data.stats} />
          <LiveMapCanvas data={data} />
        </div>
        <LiveMapDriversPanel data={data} />
      </div>
    </div>
  );
}
