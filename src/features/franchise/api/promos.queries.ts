"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchisePromosService, type FranchisePromoPayload } from "./promos.service";
import type { ListParams } from "@/shared/types/listParams";

export const franchisePromosKeys = {
  all: ["franchise", "promos"] as const,
  list: (filters?: ListParams) => [...franchisePromosKeys.all, "list", filters] as const,
  detail: (id: string) => [...franchisePromosKeys.all, "detail", id] as const,
};

export function useFranchisePromos(params?: ListParams) {
  return useQuery({
    queryKey: franchisePromosKeys.list(params),
    queryFn: () => franchisePromosService.list(params),
  });
}

export function useFranchisePromoDetail(id: string) {
  return useQuery({
    queryKey: franchisePromosKeys.detail(id),
    queryFn: () => franchisePromosService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateFranchisePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchisePromoPayload) =>
      franchisePromosService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePromosKeys.all });
      notificationService.success("Code promo créé");
    },
    onError: () => {
      notificationService.error("Impossible de créer le code promo");
    },
  });
}
