import type { QueryClient } from "@tanstack/react-query";
import type { Paginated } from "@/shared/types";

type ItemWithId = { id: string | number };

function idsMatch(a: string | number, b: string | number): boolean {
  return String(a) === String(b);
}

/**
 * Retire immédiatement un élément des listes paginées en cache (React Query).
 * Utile après suppression avant la navigation vers la liste.
 */
export function removePaginatedItemFromCaches<T extends ItemWithId>(
  qc: QueryClient,
  rootKey: readonly unknown[],
  itemId: string | number,
  listSegment = "list"
): void {
  qc.setQueriesData<Paginated<T>>(
    {
      queryKey: rootKey,
      predicate: (query) => query.queryKey[rootKey.length] === listSegment,
    },
    (old) => {
      if (!old?.data?.length) return old;
      const nextData = old.data.filter((item) => !idsMatch(item.id, itemId));
      if (nextData.length === old.data.length) return old;
      return {
        ...old,
        data: nextData,
        meta: old.meta
          ? {
              ...old.meta,
              total: Math.max(0, (old.meta.total ?? old.data.length) - 1),
            }
          : old.meta,
      };
    }
  );
}

/** Invalide et refetch toutes les requêtes d'un domaine (listes inactives incluses). */
export async function invalidateAllQueries(
  qc: QueryClient,
  queryKeys: readonly (readonly unknown[])[]
): Promise<void> {
  await Promise.all(
    queryKeys.map((queryKey) =>
      qc.invalidateQueries({ queryKey, refetchType: "all" })
    )
  );
}

/**
 * Après DELETE : mise à jour optimiste des listes + suppression fiche détail + refetch.
 */
export async function refreshListCachesAfterDelete(
  qc: QueryClient,
  options: {
    listRootKeys: readonly (readonly unknown[])[];
    itemId: string | number;
    detailKey?: readonly unknown[];
    listSegment?: string;
  }
): Promise<void> {
  const { listRootKeys, itemId, detailKey, listSegment = "list" } = options;

  for (const rootKey of listRootKeys) {
    removePaginatedItemFromCaches(qc, rootKey, itemId, listSegment);
  }

  if (detailKey) {
    qc.removeQueries({ queryKey: detailKey });
  }

  await invalidateAllQueries(qc, listRootKeys);
}
