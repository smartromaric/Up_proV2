"use client";

import type { LiveMapData } from "@/shared/types";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";

interface FranchiseLiveMapPartnerFilterProps {
  options: NonNullable<LiveMapData["filter_options"]>;
  value: FranchiseLiveMapFiltersValue;
  onChange: (next: FranchiseLiveMapFiltersValue) => void;
}

export function FranchiseLiveMapPartnerFilter({
  options,
  value,
  onChange,
}: FranchiseLiveMapPartnerFilterProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
      <div className="min-w-[200px] flex-1 sm:max-w-[280px]">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Partenaire
        </label>
        <select
          value={value.partnerId ?? ""}
          disabled={options.partners.length === 0}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ partnerId: v || null });
          }}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2 disabled:opacity-50"
        >
          <option value="">Tous les partenaires</option>
          {options.partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.city}
            </option>
          ))}
        </select>
      </div>

      {value.partnerId != null && (
        <button
          type="button"
          onClick={() => onChange({ partnerId: null })}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
