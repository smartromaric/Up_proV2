"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import { usePartnersList } from "@/features/network/api/partners.queries";
import {
  VehicleCreatePiecesSection,
  type VehiclePieceFile,
} from "@/features/partner/components/VehicleCreatePiecesSection";
import {
  EMPTY_DRIVER,
  VehicleCreateDriverSection,
} from "@/features/partner/components/VehicleCreateDriverSection";
import { useFranchiseDetail } from "@/features/network/api/franchiseDetail.queries";
import { usePartnerDetail } from "@/features/network/api/partnerDetail.queries";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { useCatalogCountryForPartner } from "@/shared/hooks/useCatalogCountryForPartner";
import type { Partner, PartnerDetail } from "@/shared/types";
import {
  VehicleCreateDriverDocumentsSection,
  type DriverDocumentFile,
} from "@/features/partner/components/VehicleCreateDriverDocumentsSection";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import {
  isDriverComplete,
  vehicleCreateSubmitLabel,
} from "../lib/vehicleCreateForm";
import {
  useCreateAdminVehicle,
  useVehicleBrandModelsCatalog,
  useVehicleBrandsCatalog,
  useVehicleCategoriesCatalog,
  useVehicleColorsCatalog,
} from "../api/vehicles.queries";

interface VehicleCreatePageProps {
  /** Création depuis la fiche partenaire admin — partenaire verrouillé, chauffeur obligatoire. */
  lockedPartnerId?: string;
}

export function VehicleCreatePage({ lockedPartnerId }: VehicleCreatePageProps = {}) {
  const router = useRouter();
  const create = useCreateAdminVehicle();
  const legacy = useLegacyAdminApi();
  const adminLocked = Boolean(lockedPartnerId);
  const { data: lockedPartner, isLoading: partnerDetailLoading } = usePartnerDetail(
    lockedPartnerId ?? ""
  );

  const { data: partners } = usePartnersList({ per_page: 100 });
  const { data: categories, isLoading: categoriesLoading } = useVehicleCategoriesCatalog();
  const { data: brands, isLoading: brandsLoading } = useVehicleBrandsCatalog();
  const { data: colors, isLoading: colorsLoading } = useVehicleColorsCatalog();

  const [partnerId, setPartnerId] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [seats, setSeats] = useState(4);
  const [plate, setPlate] = useState("");
  const [pieces, setPieces] = useState<VehiclePieceFile[]>([]);
  const [driver, setDriver] = useState<CreateDriverPayload | null>({ ...EMPTY_DRIVER });
  const [driverDocuments, setDriverDocuments] = useState<DriverDocumentFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: models, isLoading: modelsLoading } = useVehicleBrandModelsCatalog(brandCode);

  const selectedPartner = useMemo((): Partner | PartnerDetail | null => {
    if (adminLocked && lockedPartner) return lockedPartner;
    if (!partnerId) return null;
    const fromList = (partners?.data ?? []).find((p) => String(p.id) === partnerId);
    return fromList ?? null;
  }, [adminLocked, lockedPartner, partnerId, partners?.data]);

  const franchiseIdForCountry = useMemo(() => {
    const fid = selectedPartner?.franchise_id;
    if (fid == null || fid === "—") return "";
    return String(fid);
  }, [selectedPartner?.franchise_id]);

  const { data: franchiseDetail } = useFranchiseDetail(franchiseIdForCountry);

  const { data: phoneCountry } = useCatalogCountryForPartner({
    franchiseCountryId: franchiseDetail?.country_id,
    cityId:
      selectedPartner && "city_id" in selectedPartner
        ? selectedPartner.city_id
        : undefined,
    cityLabel: selectedPartner?.city,
    enabled: !legacy && Boolean(selectedPartner),
  });

  useEffect(() => {
    if (!categoryCode && categories?.length) {
      setCategoryCode(categories[0].code);
    }
  }, [categories, categoryCode]);

  useEffect(() => {
    setModelCode("");
  }, [brandCode]);

  useEffect(() => {
    if (!adminLocked || !lockedPartner) return;
    setPartnerId(String(lockedPartner.id));
    if (lockedPartner.city && lockedPartner.city !== "—") {
      setDriver((d) => ({ ...(d ?? EMPTY_DRIVER), zone: lockedPartner.city }));
    }
  }, [adminLocked, lockedPartner]);

  const handleDriverChange = (next: CreateDriverPayload | null) => {
    if (!next) return;
    setDriver(next);
  };

  const hasRegistration = pieces.some((p) => p.type === "registration");
  const driverValid = isDriverComplete(driver);
  const catalogLoading = categoriesLoading || brandsLoading || colorsLoading;

  const submit = () => {
    const next: string[] = [];
    if (!partnerId.trim()) next.push("Sélectionnez un partenaire.");
    if (!categoryCode.trim()) next.push("Sélectionnez une catégorie.");
    if (!brandCode.trim()) next.push("Sélectionnez une marque.");
    if (!modelCode.trim()) next.push("Sélectionnez un modèle.");
    if (!colorCode.trim()) next.push("Sélectionnez une couleur.");
    if (year < 1990 || year > new Date().getFullYear() + 1) {
      next.push("Année invalide.");
    }
    if (seats < 1 || seats > 12) next.push("Nombre de places invalide.");
    if (!driverValid) {
      next.push("Renseignez tous les champs du chauffeur.");
    }
    setErrors(next);
    if (next.length) return;

    create.mutate(
      {
        data: {
          partnerId: partnerId.trim(),
          categoryCode: categoryCode.trim(),
          brandCode: brandCode.trim(),
          modelCode: modelCode.trim(),
          colorCode: colorCode.trim(),
          manufactureYear: year,
          seatsCount: seats,
          plateNumber: plate.trim() || undefined,
        },
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
              "Binôme créé — pièces enregistrées, validation en cours"
            );
          } else {
            notificationService.success(
              "Binôme créé — pensez à ajouter la carte grise pour la validation"
            );
          }
          if (adminLocked && lockedPartnerId) {
            router.push(`/admin/network/partners/${lockedPartnerId}?tab=drivers`);
          } else {
            router.push("/admin/fleet/vehicles");
          }
        },
      }
    );
  };

  const backHref = adminLocked && lockedPartnerId
    ? `/admin/network/partners/${lockedPartnerId}?tab=drivers`
    : "/admin/fleet/vehicles";
  const backLabel = adminLocked ? "← Retour au partenaire" : "← Retour à la liste";

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title={adminLocked ? "Nouveau chauffeur et véhicule" : "Nouveau véhicule et chauffeur"}
        breadcrumb={
          adminLocked
            ? ["Admin", "Réseau", "Partenaire", "Nouveau binôme"]
            : ["Admin", "Flotte", "Véhicules", "Nouveau"]
        }
      />

      <p className="mb-6 text-sm">
        <Link href={backHref} className="text-teal hover:underline">
          {backLabel}
        </Link>
      </p>

      {errors.length > 0 && (
        <ul className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informations véhicule</h2>

            <label className="block">
              <span className="text-sm font-medium">Partenaire</span>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                disabled={adminLocked || partnerDetailLoading}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:bg-muted/10 disabled:text-muted"
                required
              >
                <option value="">
                  {adminLocked && partnerDetailLoading
                    ? "— Chargement… —"
                    : "— Choisir un partenaire —"}
                </option>
                {(partners?.data ?? []).map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.name}
                    {p.city ? ` · ${p.city}` : ""}
                  </option>
                ))}
              </select>
              {adminLocked && lockedPartner && (
                <p className="mt-1 text-xs text-muted">
                  Partenaire verrouillé depuis la fiche réseau.
                </p>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium">Catégorie</span>
              <select
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                disabled={catalogLoading}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                required
              >
                <option value="">— Catégorie —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Marque</span>
                <select
                  value={brandCode}
                  onChange={(e) => setBrandCode(e.target.value)}
                  disabled={catalogLoading}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">— Marque —</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Modèle</span>
                <select
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  disabled={!brandCode || modelsLoading}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">
                    {!brandCode ? "— Choisir une marque d'abord —" : "— Modèle —"}
                  </option>
                  {(models ?? []).map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Couleur</span>
              <select
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                disabled={catalogLoading}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                required
              >
                <option value="">— Couleur —</option>
                {(colors ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
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
                <span className="text-sm font-medium">Places</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
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
                placeholder="AB-452-CI"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
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
          <Button
            type="submit"
            disabled={create.isPending || catalogLoading || !driverValid}
          >
            {create.isPending ? "Création…" : vehicleCreateSubmitLabel(pieces)}
          </Button>
          <Link href={backHref}>
            <Button type="button" variant="secondary">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
