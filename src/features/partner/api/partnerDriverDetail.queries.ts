"use client";

import { useQuery } from "@tanstack/react-query";
import {
  partnerDriverDetailService,
  partnerLiveMapService,
} from "./partnerDriverDetail.service";

export const partnerDriverDetailKeys = {
  all: ["partner", "drivers"] as const,
  trips: (id: string) => [...partnerDriverDetailKeys.all, id, "trips"] as const,
  wallet: (id: string) =>
    [...partnerDriverDetailKeys.all, id, "wallet"] as const,
  live: (id: string) => [...partnerDriverDetailKeys.all, id, "live"] as const,
};

export const partnerLiveMapKeys = {
  all: ["partner", "ops", "map"] as const,
};

export function usePartnerDriverTrips(id: string) {
  return useQuery({
    queryKey: partnerDriverDetailKeys.trips(id),
    queryFn: () => partnerDriverDetailService.getTrips(id),
    enabled: Boolean(id),
  });
}

export function usePartnerDriverWalletTransactions(id: string, enabled = true) {
  return useQuery({
    queryKey: partnerDriverDetailKeys.wallet(id),
    queryFn: () => partnerDriverDetailService.getWalletTransactions(id),
    enabled: Boolean(id) && enabled,
  });
}

export function usePartnerDriverLive(id: string, enabled = true) {
  return useQuery({
    queryKey: partnerDriverDetailKeys.live(id),
    queryFn: () => partnerDriverDetailService.getLivePosition(id),
    enabled: Boolean(id) && enabled,
    refetchInterval: 30_000,
  });
}

export function usePartnerLiveMap() {
  return useQuery({
    queryKey: partnerLiveMapKeys.all,
    queryFn: () => partnerLiveMapService.get(),
    refetchInterval: 30_000,
  });
}
