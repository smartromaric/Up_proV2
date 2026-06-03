"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { notificationService } from "@/core/http/notificationService";
import { dispatchPortalKeys } from "./dispatchPortal.keys";
import {
  dispatchPortalService,
  type DispatchBookPayload,
} from "./dispatchPortal.service";

export function useDispatchPortalConsole() {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: dispatchPortalKeys.console(scopeKey),
    queryFn: () => dispatchPortalService.getConsole(),
    refetchInterval: 15_000,
  });
}

export function useDispatchPortalAssign() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: ({
      tripId,
      driverId,
    }: {
      tripId: string;
      driverId: number;
    }) => dispatchPortalService.assignDriver(tripId, driverId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchPortalKeys.all(scopeKey) });
      notificationService.success("Chauffeur assigné");
    },
    onError: () => notificationService.error("Assignation impossible"),
  });
}

export function useDispatchPortalLiveMap() {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: dispatchPortalKeys.map(scopeKey),
    queryFn: () => dispatchPortalService.getLiveMap(),
    refetchInterval: 20_000,
  });
}

export function useDispatchBookRide() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (payload: DispatchBookPayload) =>
      dispatchPortalService.bookRide(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchPortalKeys.all(scopeKey) });
    },
  });
}
