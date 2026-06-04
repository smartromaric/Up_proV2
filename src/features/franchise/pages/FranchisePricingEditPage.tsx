"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  PricingForm,
  type PricingFormValues,
} from "@/features/settings/components/PricingForm";
import {
  useFranchisePricingDetail,
  useUpdateFranchisePricing,
} from "../api/pricing.queries";

interface FranchisePricingEditPageProps {
  pricingId: string;
}

export function FranchisePricingEditPage({ pricingId }: FranchisePricingEditPageProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useFranchisePricingDetail(pricingId);
  const updatePricing = useUpdateFranchisePricing(pricingId);
  const [values, setValues] = useState<PricingFormValues | null>(null);

  useEffect(() => {
    if (data && !values) {
      setValues({
        franchise_id: data.franchise_id,
        franchise_name: data.franchise_name,
        zone_id: null,
        zone_name: data.zone_name,
        service: data.service,
        base_fare_fcfa: data.base_fare_fcfa,
        per_km_fcfa: data.per_km_fcfa,
        min_fare_fcfa: data.min_fare_fcfa,
        surge_multiplier: data.surge_multiplier,
        status: data.status,
      });
    }
  }, [data, values]);

  if (isLoading || !values) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Grille introuvable.{" "}
        <Link href="/franchise/pricing" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title={data.zone_name}
        breadcrumb={["Franchise", "Tarification", data.zone_name]}
      />

      <PricingForm
        mode="edit"
        hideFranchise
        values={values}
        onChange={setValues}
        isSubmitting={updatePricing.isPending}
        onCancel={() => router.push("/franchise/pricing")}
        onSubmit={() => {
          updatePricing.mutate(
            {
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
