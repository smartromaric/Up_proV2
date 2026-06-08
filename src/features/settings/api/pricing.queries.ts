"use client";



import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pricingKeys } from "./pricing.keys";

import {
  pricingService,
  type CreatePricingPayload,
  type PricingListResponse,
  type UpdatePricingPayload,
} from "./pricing.service";

import { notificationService } from "@/core/http/notificationService";



import type { ListParams } from "@/shared/types/listParams";

export function usePricingList(params?: ListParams) {
  return useQuery({
    queryKey: pricingKeys.list(params),
    queryFn: () => pricingService.list(params),
  });
}



export function useCreatePricingRule() {

  const qc = useQueryClient();

  return useMutation({

    mutationFn: (payload: CreatePricingPayload) => pricingService.create(payload),

    onSuccess: () => {

      void qc.invalidateQueries({ queryKey: pricingKeys.all });

      notificationService.success("Grille tarifaire créée");

    },

    onError: (error: Error) =>
      notificationService.error(error.message || "Création impossible"),

  });

}

export function usePricingDetail(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: () => pricingService.get(id),
    enabled: Boolean(id),
    initialData: () => {
      const cached = qc
        .getQueriesData<PricingListResponse>({ queryKey: pricingKeys.all })
        .map(([, data]) => data?.data?.find((r) => String(r.id) === id))
        .find(Boolean);
      return cached;
    },
    initialDataUpdatedAt: () => {
      const entry = qc
        .getQueryCache()
        .findAll({ queryKey: pricingKeys.all })
        .find((q) => q.state.data != null);
      return entry?.state.dataUpdatedAt;
    },
  });
}

export function useUpdatePricingRule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePricingPayload) => pricingService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pricingKeys.all });
      void qc.invalidateQueries({ queryKey: pricingKeys.detail(id) });
      notificationService.success("Grille tarifaire mise à jour");
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Mise à jour impossible"),
  });
}

