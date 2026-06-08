"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { FranchisePricingNewPageLegacy } from "./FranchisePricingNewPageLegacy";

export function FranchisePricingNewPage() {
  const router = useRouter();
  const legacy = useLegacyPortalApi();

  if (!legacy) {
    return (
      <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
        <PageHeader
          title="Nouvelle grille"
          breadcrumb={["Franchise", "Tarification", "Nouvelle"]}
        />
        <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-medium">Création indisponible en API v1</p>
          <p className="mt-2">
            Le Swagger n&apos;expose pas{" "}
            <code className="text-xs">POST /v1/franchises/&#123;id&#125;/pricing-rules</code>.
            Contactez l&apos;admin plateforme pour ajouter une grille.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/franchise/pricing")}>
              Retour
            </Button>
            <Link href="/franchise/pricing" className="text-sm text-teal underline">
              Voir les grilles existantes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <FranchisePricingNewPageLegacy />;
}
