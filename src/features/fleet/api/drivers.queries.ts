"use client";

import { useQuery } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { driversKeys } from "./drivers.keys";
import { driversService, type DriversListParams } from "./drivers.service";

export function useDriversList(params?: DriversListParams) {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: driversKeys.list(params, scopeKey),
    queryFn: () => driversService.listAdmin(params),
  });
}
