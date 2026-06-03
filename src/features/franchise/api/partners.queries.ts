"use client";

import { useQuery } from "@tanstack/react-query";
import { franchisePartnersService } from "./partners.service";
import type { ListParams } from "@/shared/types/listParams";

export const franchisePartnersKeys = {
  all: ["franchise", "partners"] as const,
  list: (filters?: ListParams) => [...franchisePartnersKeys.all, "list", filters] as const,
  detail: (id: string) => [...franchisePartnersKeys.all, "detail", id] as const,
};

export function useFranchisePartnersList(params?: ListParams) {
  return useQuery({
    queryKey: franchisePartnersKeys.list(params),
    queryFn: () => franchisePartnersService.list(params),
  });
}

export function useFranchisePartnerDetail(id: string) {
  return useQuery({
    queryKey: franchisePartnersKeys.detail(id),
    queryFn: () => franchisePartnersService.getById(id),
    enabled: Boolean(id),
  });
}
