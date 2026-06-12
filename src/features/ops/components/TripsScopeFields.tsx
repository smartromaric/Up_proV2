"use client";

import type { TripsScopeFilterOptions } from "@/shared/types";
import { parseScopeId } from "@/shared/lib/scopeId";
import { FilterField } from "@/shared/ui/FilterField";
import { FILTER_SELECT_CLASS } from "@/shared/ui/filterControlStyles";
import type { TripsScopeFiltersValue } from "./TripsScopeFilters";

interface TripsScopeFieldsProps {
  options: TripsScopeFilterOptions;
  value: TripsScopeFiltersValue;
  onChange: (next: TripsScopeFiltersValue) => void;
}

/** Sélecteurs Vue + Partenaire (sans carte englobante). */
export function TripsScopeFields({
  options,
  value,
  onChange,
}: TripsScopeFieldsProps) {
  const isGlobal = value.franchiseId === null && value.partnerId === null;

  return (
    <>
      <FilterField
        label="Vue"
        className="min-w-[min(100%,240px)] flex-1 sm:min-w-[220px]"
      >
        <select
          value={isGlobal ? "global" : value.franchiseId ?? "global"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "global") {
              onChange({ franchiseId: null, partnerId: null });
              return;
            }
            onChange({
              franchiseId: parseScopeId(v),
              partnerId: null,
            });
          }}
          className={FILTER_SELECT_CLASS}
        >
          <option value="global">Mondiale — toutes franchises</option>
          {options.franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.city})
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField
        label="Partenaire"
        className="min-w-[min(100%,240px)] flex-1 sm:min-w-[220px]"
      >
        <select
          value={value.partnerId ?? ""}
          disabled={options.partners.length === 0}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              onChange({ franchiseId: value.franchiseId, partnerId: null });
              return;
            }
            const partnerId = parseScopeId(v);
            const partner = options.partners.find(
              (p) => String(p.id) === String(partnerId)
            );
            onChange({
              franchiseId: partner?.franchise_id ?? value.franchiseId,
              partnerId,
            });
          }}
          className={FILTER_SELECT_CLASS}
        >
          <option value="">Tous les partenaires</option>
          {options.partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {value.franchiseId === null && p.franchise_name
                ? ` · ${p.franchise_name}`
                : ""}
            </option>
          ))}
        </select>
      </FilterField>
    </>
  );
}
