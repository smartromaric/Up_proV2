"use client";

import { useState } from "react";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { useCatalogCountryForPartner } from "@/shared/hooks/useCatalogCountryForPartner";
import { usePartnerProfile } from "../api/profile.queries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import {
  VehicleCreatePiecesSection,
  type VehiclePieceFile,
} from "../components/VehicleCreatePiecesSection";
import {
  EMPTY_DRIVER,
  VehicleCreateDriverSection,
} from "../components/VehicleCreateDriverSection";
import {
  VehicleCreateDriverDocumentsSection,
  type DriverDocumentFile,
} from "../components/VehicleCreateDriverDocumentsSection";
import type { CreateDriverPayload } from "../api/drivers.service";
import type { VehicleCategory } from "@/shared/types";
import {
  isDriverComplete,
  vehicleCreateSubmitLabel,
} from "@/features/fleet/lib/vehicleCreateForm";
import { useCreateVehicle } from "../api/vehicles.queries";

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "taxi", label: "Taxi" },
  { value: "delivery", label: "Livraison" },
  { value: "van", label: "Utilitaire" },
  { value: "premium", label: "Premium" },
];

export function PartnerVehicleCreatePage() {
  const router = useRouter();
  const legacy = useLegacyPortalApi();
  const create = useCreateVehicle();
  const { data: profile } = usePartnerProfile();
  const { data: phoneCountry } = useCatalogCountryForPartner({
    cityLabel: profile?.city,
    enabled: !legacy && Boolean(profile?.city),
  });
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [category, setCategory] = useState<VehicleCategory>("taxi");
  const [pieces, setPieces] = useState<VehiclePieceFile[]>([]);
  const [driver, setDriver] = useState<CreateDriverPayload | null>({ ...EMPTY_DRIVER });
  const [driverDocuments, setDriverDocuments] = useState<DriverDocumentFile[]>([]);

  const handleDriverChange = (next: CreateDriverPayload | null) => {
    if (!next) return;
    setDriver(next);
  };

  const hasRegistration = pieces.some((p) => p.type === "registration");
  const driverValid = isDriverComplete(driver);

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Nouveau chauffeur et véhicule"
        breadcrumb={["Partenaire", "Flotte", "Nouveau binôme"]}
      />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!driverValid) {
            notificationService.warning("Renseignez tous les champs du chauffeur.");
            return;
          }
          create.mutate(
            {
              data: { brand, model, year, color, category, plate: plate || undefined },
              pieces,
              driver,
              driverDocuments,
            },
            {
              onSuccess: (vehicle) => {
                if (vehicle.driver_name) {
                  notificationService.success(
                    `Chauffeur et véhicule créés — ${vehicle.driver_name} assigné`
                  );
                } else if (pieces.length === 0) {
                  notificationService.info(
                    "Binôme créé — pièces à ajouter sur la fiche véhicule"
                  );
                } else if (hasRegistration) {
                  notificationService.success(
                    "Véhicule créé — pièces envoyées, validation en cours"
                  );
                } else {
                  notificationService.success(
                    "Véhicule créé — pensez à ajouter la carte grise pour la validation"
                  );
                }
                router.push(`/partner/fleet/${vehicle.id}`);
              },
              onError: () => {
                notificationService.error("Impossible de créer le véhicule");
              },
            }
          );
        }}
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informations véhicule</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Marque</span>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  placeholder="Toyota"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Modèle</span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  placeholder="Corolla"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Catégorie</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Année</span>
                <input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Couleur</span>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Plaque (optionnel)</span>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                placeholder="AB-452-CI"
              />
            </label>
          </div>

          <VehicleCreatePiecesSection pieces={pieces} onChange={setPieces} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <VehicleCreateDriverSection
            driver={driver}
            onChange={handleDriverChange}
            required
            phoneCountry={legacy ? null : phoneCountry}
          />
          <VehicleCreateDriverDocumentsSection
            documents={driverDocuments}
            onChange={setDriverDocuments}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-6">
          <Button type="submit" disabled={create.isPending || !driverValid}>
            {create.isPending ? "Création…" : vehicleCreateSubmitLabel(pieces)}
          </Button>
          <Link href="/partner/fleet">
            <Button type="button" variant="secondary">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
