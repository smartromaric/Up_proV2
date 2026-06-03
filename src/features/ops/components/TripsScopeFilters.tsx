"use client";

import type { TripsScopeFilterOptions } from "@/shared/types";
import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";
import { LiveMapScopeFilters } from "./LiveMapScopeFilters";

export type TripsScopeFiltersValue = LiveMapScopeFiltersValue;

interface TripsScopeFiltersProps {
  options: TripsScopeFilterOptions;
  value: TripsScopeFiltersValue;
  onChange: (next: TripsScopeFiltersValue) => void;
}

/** Filtres franchise / partenaire pour le suivi des courses (admin). */
export function TripsScopeFilters(props: TripsScopeFiltersProps) {
  return <LiveMapScopeFilters {...props} />;
}
