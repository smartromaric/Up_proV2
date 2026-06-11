"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { partnerFreightService, type UpdateFreightOfferPayload } from "./freight.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerFreightKeys = {
  all: ["partner", "freight-offers"] as const,
  list: (filters?: ListParams) => [...partnerFreightKeys.all, "list", filters] as const,
};

export function usePartnerFreightOffers(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerFreightKeys.list(params),
    queryFn: () => partnerFreightService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function useUpdateFreightOffer(offerId: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: UpdateFreightOfferPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerFreightService.update(ownerId, offerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerFreightKeys.all });
    },
  });
}
