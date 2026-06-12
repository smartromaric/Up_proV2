import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { matchesListDateRange } from "./listDateRange";

/** Pagination / filtres côté client quand l’API v1 ne pagine pas. */
export function paginateClientList<T>(
  items: T[],
  params?: ListParams,
  matches?: (item: T) => boolean,
  getDate?: (item: T) => string | null | undefined
): Paginated<T> {
  let rows = matches ? items.filter(matches) : items;

  if (getDate) {
    rows = rows.filter((item) => matchesListDateRange(getDate(item), params));
  }

  const q = params?.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(q)
    );
  }

  const perPage = Math.max(1, params?.per_page ?? 20);
  const page = Math.max(1, params?.page ?? 1);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, lastPage);
  const start = (currentPage - 1) * perPage;

  return {
    data: rows.slice(start, start + perPage),
    meta: {
      total,
      per_page: perPage,
      current_page: currentPage,
      last_page: lastPage,
    },
  };
}
