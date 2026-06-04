"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { franchiseReconciliationService } from "./reconciliation.service";

export const franchiseReconciliationKeys = {
  all: ["franchise", "reconciliation"] as const,
  list: (params?: ListParams) =>
    [...franchiseReconciliationKeys.all, "list", params] as const,
};

export function useFranchiseReconciliationList(params?: ListParams) {
  return useQuery({
    queryKey: franchiseReconciliationKeys.list(params),
    queryFn: () => franchiseReconciliationService.list(params),
  });
}
