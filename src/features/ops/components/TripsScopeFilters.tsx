"use client";

import type { TripsScopeFilterOptions } from "@/shared/types";
import { parseScopeId } from "@/shared/lib/scopeId";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";

export type TripsScopeFiltersValue = LiveMapScopeFiltersValue;

const SELECT_CLASS =
  "w-full min-h-[42px] rounded-lg border border-border bg-canvas px-3 py-2.5 text-base text-foreground outline-none ring-teal/30 focus:ring-2 disabled:opacity-50";

const DATE_INPUT_CLASS =
  "w-full min-h-[42px] rounded-lg border border-border bg-canvas px-3 py-2.5 text-base text-foreground outline-none ring-teal/30 focus:ring-2";

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

/** Filtres franchise / partenaire / dates pour le suivi des courses (admin). */
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
    <div className="flex flex-wrap items-end gap-4 rounded-card border border-border bg-surface px-4 py-4 shadow-card">
      <div className="min-w-[min(100%,280px)] flex-1 sm:min-w-[280px] sm:max-w-[380px]">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Vue
        </label>
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
          className={SELECT_CLASS}
        >
          <option value="global">Mondiale — toutes franchises</option>
          {options.franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.city})
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[min(100%,300px)] flex-1 sm:min-w-[300px] sm:max-w-[440px]">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Partenaire
        </label>
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
          className={SELECT_CLASS}
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
      </div>

      {showDateFilters && onDateFromChange && onDateToChange && (
        <>
          <div className="min-w-[min(100%,160px)] flex-1 sm:min-w-[160px] sm:max-w-[200px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted">
              Date du
            </label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => onDateFromChange(e.target.value)}
              className={DATE_INPUT_CLASS}
            />
          </div>
          <div className="min-w-[min(100%,160px)] flex-1 sm:min-w-[160px] sm:max-w-[200px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted">
              Date au
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => onDateToChange(e.target.value)}
              className={DATE_INPUT_CLASS}
            />
          </div>
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
          className="min-h-[42px] rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
