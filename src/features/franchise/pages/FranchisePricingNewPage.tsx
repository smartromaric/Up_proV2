"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  PricingForm,
  type PricingFormValues,
} from "@/features/settings/components/PricingForm";
import { useCreateFranchisePricing } from "../api/pricing.queries";
import {
  AbidjanZonesMap,
  type ZoneMapItem,
} from "@/features/network/components/AbidjanZonesMap";
import { useZonesMapOverview } from "@/features/network/api/zones.queries";

const FRANCHISE_ID = 1;
const FRANCHISE_NAME = "Côte d'Ivoire";

const INITIAL: PricingFormValues = {
  franchise_id: FRANCHISE_ID,
  franchise_name: FRANCHISE_NAME,
  zone_id: null,
  zone_name: "",
  service: "taxi",
  base_fare_fcfa: 500,
  per_km_fcfa: 350,
  min_fare_fcfa: 1500,
  surge_multiplier: 1,
  status: "draft",
};

export function FranchisePricingNewPage() {
  const router = useRouter();
  const createPricing = useCreateFranchisePricing();
  const { data: mapData, isLoading: mapLoading } = useZonesMapOverview();
  const [values, setValues] = useState<PricingFormValues>(INITIAL);
  const [selectedZone, setSelectedZone] = useState<ZoneMapItem | null>(null);

  const zones = useMemo(
    () =>
      (mapData?.zones ?? []).filter((z) => z.franchise_name === FRANCHISE_NAME),
    [mapData?.zones]
  );

  const handleSelectZone = (zone: ZoneMapItem) => {
    setSelectedZone(zone);
    setValues((prev) => ({
      ...prev,
      zone_id: zone.id,
      zone_name: zone.name,
    }));
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Nouvelle grille"
        breadcrumb={["Franchise", "Tarification", "Nouvelle"]}
      />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-heading">
          Choisir une zone sur la carte ({FRANCHISE_NAME})
        </h2>
        {mapLoading ? (
          <div className="relative h-[min(380px,50vh)] overflow-hidden rounded-card border border-border bg-map shadow-card">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-navy/8 to-teal/5" />
          </div>
        ) : zones.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-canvas px-4 py-8 text-center text-sm text-muted">
            Aucune zone cartographiée pour votre territoire.
          </p>
        ) : (
          <AbidjanZonesMap
            mode="select"
            zones={zones}
            cityLabel={mapData?.city ?? FRANCHISE_NAME}
            selectedZoneId={selectedZone?.id ?? null}
            onSelectZone={handleSelectZone}
          />
        )}
      </section>

      <PricingForm
        hideFranchise
        values={values}
        selectedZone={selectedZone}
        onChange={setValues}
        isSubmitting={createPricing.isPending}
        onCancel={() => router.push("/franchise/pricing")}
        onSubmit={() => {
          createPricing.mutate(
            {
              zone_name: values.zone_name,
              service: values.service,
              base_fare_fcfa: values.base_fare_fcfa,
              per_km_fcfa: values.per_km_fcfa,
              min_fare_fcfa: values.min_fare_fcfa,
              surge_multiplier: values.surge_multiplier,
              status: values.status,
            },
            { onSuccess: () => router.push("/franchise/pricing") }
          );
        }}
      />
    </div>
  );
}
