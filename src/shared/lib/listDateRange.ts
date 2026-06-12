import type { ListParams } from "@/shared/types/listParams";

/** Filtre inclusif sur une date ISO (champ métier : soumis le, créé le, etc.). */
export function matchesListDateRange(
  iso: string | null | undefined,
  params?: ListParams
): boolean {
  const from = params?.date_from?.trim();
  const to = params?.date_to?.trim();
  if (!from && !to) return true;

  if (!iso?.trim()) return false;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (date < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (date > end) return false;
  }
  return true;
}

export function hasListDateFilter(params?: ListParams): boolean {
  return Boolean(params?.date_from?.trim() || params?.date_to?.trim());
}
