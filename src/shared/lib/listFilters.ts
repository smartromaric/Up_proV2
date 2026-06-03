/** Valeur considérée comme « pas de filtre » (défaut). */
export function isDefaultFilterValue(value: unknown): boolean {
  return value === "all" || value === "" || value == null;
}

export function isSearchActive(search: string): boolean {
  return search.trim().length > 0;
}

/** Au moins un filtre actif (recherche + paires valeur / défaut). */
export function hasActiveListFilters(
  search: string,
  fields: { value: unknown; defaultValue: unknown }[] = []
): boolean {
  if (isSearchActive(search)) return true;
  return fields.some(
    ({ value, defaultValue }) =>
      !isDefaultFilterValue(value) && value !== defaultValue
  );
}
