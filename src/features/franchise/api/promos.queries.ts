"use client";

import { useQuery } from "@tanstack/react-query";
import {
  franchisePromosService,
  franchiseSupportService,
} from "./promos.service";
import type { ListParams } from "@/shared/types/listParams";

export const franchisePromosKeys = {
  all: ["franchise", "promos"] as const,
  list: (filters?: ListParams) => [...franchisePromosKeys.all, "list", filters] as const,
};

export const franchiseSupportKeys = {
  all: ["franchise", "support"] as const,
  list: (filters?: ListParams) => [...franchiseSupportKeys.all, "list", filters] as const,
};

export function useFranchisePromos(params?: ListParams) {
  return useQuery({
    queryKey: franchisePromosKeys.list(params),
    queryFn: () => franchisePromosService.list(params),
  });
}

export function useFranchiseSupportTickets(params?: ListParams) {
  return useQuery({
    queryKey: franchiseSupportKeys.list(params),
    queryFn: () => franchiseSupportService.list(params),
  });
}
