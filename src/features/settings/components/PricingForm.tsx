"use client";

import type { PricingRule } from "@/shared/types";
import { Button } from "@/shared/ui/Button";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import type { ZoneMapItem } from "@/features/network/components/AbidjanZonesMap";

export interface PricingFranchiseOption {
  id: number | string;
  name: string;
  city: string;
}

export interface PricingFormValues {
  franchise_id: number | string | null;
  franchise_name?: string;
  zone_id: number | string | null;
  zone_name: string;
  service: PricingRule["service"];
  base_fare_fcfa: number;
  per_km_fcfa: number;
  min_fare_fcfa: number;
  surge_multiplier: number;
  status: PricingRule["status"];
}

interface PricingFormProps {
  values: PricingFormValues;
  selectedZone?: ZoneMapItem | null;
  franchiseOptions?: PricingFranchiseOption[];
  hideFranchise?: boolean;
  mode?: "create" | "edit";
  onChange: (values: PricingFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PricingForm({
  values,
  selectedZone = null,
  franchiseOptions = [],
  hideFranchise = false,
  mode = "create",
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: PricingFormProps) {
  const set = (patch: Partial<PricingFormValues>) =>
    onChange({ ...values, ...patch });

  return (
    <form
      className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {!hideFranchise && (
      <div className="block">
        <span className="text-sm font-medium">Franchise</span>
        {mode === "edit" ? (
          <p className="mt-2 rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm font-medium text-foreground">
            {values.franchise_name ??
              franchiseOptions.find((f) => f.id === values.franchise_id)?.name ??
              "Franchise"}
          </p>
        ) : (
          <select
            required
            value={values.franchise_id ?? ""}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              set({ franchise_id: id, zone_id: null, zone_name: "" });
            }}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="">Choisir une franchise</option>
            {franchiseOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} · {f.city}
              </option>
            ))}
          </select>
        )}
      </div>
      )}

      <div className="block">
        <span className="text-sm font-medium">Zone</span>
        {mode === "edit" ? (
          <p className="mt-2 rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm font-medium text-foreground">
            {values.zone_name}
          </p>
        ) : selectedZone ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-teal/30 bg-teal/5 px-3 py-2.5">
            <div>
              <p className="font-medium text-foreground">{selectedZone.name}</p>
              {selectedZone.franchise_name && (
                <p className="text-xs text-muted">{selectedZone.franchise_name}</p>
              )}
            </div>
            <ZoneTypePill type={selectedZone.type} />
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-border bg-canvas px-3 py-4 text-center text-sm text-muted">
            Sélectionnez une zone sur la carte ci-dessus
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-medium">Service</span>
        <select
          value={values.service}
          onChange={(e) =>
            set({ service: e.target.value as PricingRule["service"] })
          }
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        >
          <option value="taxi">Taxi</option>
          <option value="delivery">Livraison</option>
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Prise en charge (FCFA)</span>
          <input
            type="number"
            min={1}
            required
            value={values.base_fare_fcfa}
            onChange={(e) => set({ base_fare_fcfa: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Par km (FCFA)</span>
          <input
            type="number"
            min={1}
            required
            value={values.per_km_fcfa}
            onChange={(e) => set({ per_km_fcfa: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Minimum (FCFA)</span>
          <input
            type="number"
            min={1}
            required
            value={values.min_fare_fcfa}
            onChange={(e) => set({ min_fare_fcfa: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Multiplicateur surge</span>
          <input
            type="number"
            min={1}
            step={0.05}
            required
            value={values.surge_multiplier}
            onChange={(e) => set({ surge_multiplier: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Statut</span>
        <select
          value={values.status}
          onChange={(e) =>
            set({ status: e.target.value as PricingRule["status"] })
          }
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
        </select>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            (mode === "create" &&
              (!values.franchise_id || !selectedZone || !values.zone_name.trim()))
          }
        >
          {isSubmitting
            ? "Enregistrement…"
            : mode === "edit"
              ? "Enregistrer"
              : "Créer la grille"}
        </Button>
      </div>
    </form>
  );
}
