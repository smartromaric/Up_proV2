"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  franchisePricingService,
  type FranchiseCreatePricingPayload,
  type FranchiseUpdatePricingPayload,
} from "./pricing.service";
import type { ListParams } from "@/shared/types/listParams";

export const franchisePricingKeys = {
  all: ["franchise", "pricing"] as const,
  list: (filters?: ListParams) =>
    [...franchisePricingKeys.all, "list", filters] as const,
  detail: (id: string) => [...franchisePricingKeys.all, "detail", id] as const,
};

export function useFranchisePricing(params?: ListParams) {
  return useQuery({
    queryKey: franchisePricingKeys.list(params),
    queryFn: () => franchisePricingService.list(params),
  });
}

export function useFranchisePricingDetail(id: string) {
  return useQuery({
    queryKey: franchisePricingKeys.detail(id),
    queryFn: () => franchisePricingService.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateFranchisePricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseCreatePricingPayload) =>
      franchisePricingService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePricingKeys.all });
      notificationService.success("Grille tarifaire créée");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Création impossible"),
  });
}

export function useUpdateFranchisePricing(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseUpdatePricingPayload) =>
      franchisePricingService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchisePricingKeys.all });
      void qc.invalidateQueries({ queryKey: franchisePricingKeys.detail(id) });
      notificationService.success("Grille tarifaire mise à jour");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Mise à jour impossible"),
  });
}
