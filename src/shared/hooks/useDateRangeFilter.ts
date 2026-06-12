"use client";

import { useCallback, useMemo, useState } from "react";
import {
  formatDateRangeLabel,
  presetToDateRange,
  type DateRangePreset,
} from "@/shared/lib/dateRange";
import type { ListParams } from "@/shared/types/listParams";

export interface UseDateRangeFilterOptions {
  /** Preset par défaut (défaut : 7 jours). */
  defaultPreset?: DateRangePreset;
}

export function useDateRangeFilter({
  defaultPreset = "7d",
}: UseDateRangeFilterOptions = {}) {
  const [preset, setPresetState] = useState<DateRangePreset>(defaultPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(
    () => presetToDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const dateFrom = range?.from ?? "";
  const dateTo = range?.to ?? "";

  const setPreset = useCallback((next: DateRangePreset) => {
    setPresetState(next);
    if (next !== "custom") {
      setCustomFrom("");
      setCustomTo("");
    }
  }, []);

  const reset = useCallback(() => {
    setPresetState(defaultPreset);
    setCustomFrom("");
    setCustomTo("");
  }, [defaultPreset]);

  const isActive =
    preset !== defaultPreset ||
    (preset === "custom" && Boolean(customFrom || customTo));

  const listParams: Pick<ListParams, "date_from" | "date_to"> = useMemo(
    () => ({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [dateFrom, dateTo]
  );

  const rangeLabel =
    dateFrom && dateTo ? formatDateRangeLabel(dateFrom, dateTo) : undefined;

  return {
    preset,
    setPreset,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    dateFrom,
    dateTo,
    listParams,
    rangeLabel,
    isActive,
    reset,
    resetField: {
      value: isActive,
      defaultValue: false,
      reset,
    },
  };
}
