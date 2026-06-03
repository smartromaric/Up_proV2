"use client";

import { useQuery } from "@tanstack/react-query";
import {
  commissionsService,
  reconciliationService,
} from "./commissions.service";
import type { ListParams } from "@/shared/types/listParams";

export const commissionsKeys = {
  all: ["finance", "commissions"] as const,
  list: (filters?: ListParams) => [...commissionsKeys.all, "list", filters] as const,
};

export const reconciliationKeys = {
  all: ["finance", "reconciliation"] as const,
  list: (filters?: ListParams) => [...reconciliationKeys.all, "list", filters] as const,
};

export function useCommissionsList(params?: ListParams) {
  return useQuery({
    queryKey: commissionsKeys.list(params),
    queryFn: () => commissionsService.list(params),
  });
}

export function useReconciliationList(params?: ListParams) {
  return useQuery({
    queryKey: reconciliationKeys.list(params),
    queryFn: () => reconciliationService.list(params),
  });
}
