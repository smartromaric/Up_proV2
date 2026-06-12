"use client";

import {
  DATE_RANGE_PRESET_LABELS,
  type DateRangePreset,
} from "@/shared/lib/dateRange";
import { FilterField } from "./FilterField";
import {
  FILTER_CHIP_CLASS,
  FILTER_CONTROL_CLASS,
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
} from "./filterControlStyles";

const PRESET_OPTIONS: DateRangePreset[] = [
  "today",
  "yesterday",
  "3d",
  "7d",
  "custom",
];

interface DateRangeFilterProps {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  /** Affiche le preset « Tout » (aucun filtre date). */
  showAllPreset?: boolean;
  /** Masque le label (si le parent fournit un titre de section). */
  hideLabel?: boolean;
  rangeLabel?: string;
  className?: string;
}

export function DateRangeFilter({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  showAllPreset = false,
  hideLabel = false,
  rangeLabel,
  className = "",
}: DateRangeFilterProps) {
  const presets: DateRangePreset[] = showAllPreset
    ? ["all", ...PRESET_OPTIONS]
    : PRESET_OPTIONS;

  return (
    <div className={`${FILTER_FIELD_CLASS} ${className}`}>
      {!hideLabel && <span className={FILTER_LABEL_CLASS}>Période</span>}
      <div className="flex flex-wrap gap-2">
        {presets.map((opt) => {
          const active = opt === preset;
          const label =
            opt === "custom"
              ? "Personnalisé"
              : DATE_RANGE_PRESET_LABELS[opt as Exclude<DateRangePreset, "custom">];
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onPresetChange(opt)}
              className={`${FILTER_CHIP_CLASS} ${
                active
                  ? "border border-teal bg-teal text-white"
                  : "border border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap gap-3">
          <FilterField label="Du" className="min-w-[140px] flex-1">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className={`${FILTER_CONTROL_CLASS} w-full`}
            />
          </FilterField>
          <FilterField label="Au" className="min-w-[140px] flex-1">
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
              className={`${FILTER_CONTROL_CLASS} w-full`}
            />
          </FilterField>
        </div>
      )}

      {rangeLabel && preset !== "all" && (
        <p className="text-xs text-muted tabular-nums">{rangeLabel}</p>
      )}
    </div>
  );
}
