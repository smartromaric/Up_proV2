"use client";

import { FilterField } from "@/shared/ui/FilterField";
import { FILTER_CONTROL_CLASS } from "@/shared/ui/filterControlStyles";
import type { TripsScopeFilterOptions } from "@/shared/types";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import { TripsScopeFields } from "./TripsScopeFields";

export type TripsScopeFiltersValue = LiveMapScopeFiltersValue;

const FIELD_CONTROL = `${FILTER_CONTROL_CLASS} w-full`;

interface TripsScopeFiltersProps {
  options: TripsScopeFilterOptions;
  value: TripsScopeFiltersValue;
  onChange: (next: TripsScopeFiltersValue) => void;
  showDateFilters?: boolean;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
}

/** Filtres franchise / partenaire / dates (carte compacte — dispatch, transactions). */
export function TripsScopeFilters({
  options,
  value,
  onChange,
  showDateFilters = false,
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
}: TripsScopeFiltersProps) {
  const isGlobal = value.franchiseId === null && value.partnerId === null;
  const hasDateFilter = Boolean(dateFrom || dateTo);

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <TripsScopeFields options={options} value={value} onChange={onChange} />

      {showDateFilters && onDateFromChange && onDateToChange && (
        <>
          <FilterField
            label="Date du"
            className="min-w-[min(100%,160px)] flex-1 sm:min-w-[160px] sm:max-w-[200px]"
          >
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => onDateFromChange(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FilterField>
          <FilterField
            label="Date au"
            className="min-w-[min(100%,160px)] flex-1 sm:min-w-[160px] sm:max-w-[200px]"
          >
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => onDateToChange(e.target.value)}
              className={FIELD_CONTROL}
            />
          </FilterField>
        </>
      )}

      {(!isGlobal || hasDateFilter) && (
        <button
          type="button"
          onClick={() => {
            onChange({ franchiseId: null, partnerId: null });
            if (showDateFilters) {
              onDateFromChange?.("");
              onDateToChange?.("");
            }
          }}
          className={`${FILTER_CONTROL_CLASS} px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground`}
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
