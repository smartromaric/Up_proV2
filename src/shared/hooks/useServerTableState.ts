"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type { DataTableServerPagination } from "@/shared/ui/DataTable";

const DEFAULT_PAGE_SIZE = 25;

export function useServerTableState(
  resetDeps: unknown[] = [],
  extraParams: Partial<ListParams> = {},
  defaultPageSize = DEFAULT_PAGE_SIZE
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, ...resetDeps]);

  const listParams: ListParams = {
    page,
    per_page: pageSize,
    search: debouncedSearch || undefined,
    ...extraParams,
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    debouncedSearch,
    listParams,
  };
}

export function serverPaginationFromMeta<T>(
  meta: Paginated<T>["meta"] | undefined,
  setPage: (p: number) => void,
  setPageSize: (s: number) => void
): DataTableServerPagination | undefined {
  if (!meta) return undefined;
  return {
    page: meta.current_page,
    pageSize: meta.per_page,
    total: meta.total,
    lastPage: meta.last_page,
    onPageChange: setPage,
    onPageSizeChange: (size) => {
      setPageSize(size);
      setPage(1);
    },
  };
}
