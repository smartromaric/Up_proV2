"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import type { ListParams } from "@/shared/types/listParams";
import { partnerOrdersService } from "./orders.service";

export const partnerOrdersKeys = {
  all: ["partner", "orders"] as const,
  list: (filters?: ListParams) => [...partnerOrdersKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerOrdersKeys.all, "detail", id] as const,
};

export function usePartnerOrdersList(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerOrdersKeys.list(params),
    queryFn: () => partnerOrdersService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerOrderDetail(id: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerOrdersKeys.detail(id),
    queryFn: () => partnerOrdersService.getById(ownerId!, id),
    enabled: ownerId != null && Boolean(id),
  });
}
