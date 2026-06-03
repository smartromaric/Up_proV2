"use client";

import { useCallback, useMemo } from "react";
import { hasActiveListFilters } from "@/shared/lib/listFilters";

export interface FilterFieldReset {
  value: unknown;
  defaultValue: unknown;
  reset: () => void;
}

export interface UseListFiltersResetOptions {
  search?: { value: string; set: (value: string) => void };
  fields?: FilterFieldReset[];
  /** Filtres actifs forcés (ex. pendingOnly sur une route dédiée) */
  extraActive?: boolean;
}

/**
 * Regroupe la réinitialisation recherche + selects/chips et indique si des filtres sont actifs.
 */
export function useListFiltersReset({
  search,
  fields = [],
  extraActive = false,
}: UseListFiltersResetOptions) {
  const hasActiveFilters = useMemo(
    () =>
      extraActive ||
      hasActiveListFilters(
        search?.value ?? "",
        fields.map((f) => ({ value: f.value, defaultValue: f.defaultValue }))
      ),
    [search?.value, fields, extraActive]
  );

  const resetAll = useCallback(() => {
    search?.set("");
    fields.forEach((f) => f.reset());
  }, [search, fields]);

  return { hasActiveFilters, resetAll };
}
