"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { notificationService } from "@/core/http/notificationService";
import { tripsKeys } from "./trips.keys";
import { dispatchKeys } from "./dispatch.keys";
import { dispatchService } from "./dispatch.service";

export function useDispatchConsole() {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: dispatchKeys.console(scopeKey),
    queryFn: () => dispatchService.getConsole(),
    refetchInterval: 15_000,
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: ({ tripId, driverId }: { tripId: string; driverId: number }) =>
      dispatchService.assignDriver(tripId, driverId),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: dispatchKeys.all(scopeKey) });
      void qc.invalidateQueries({ queryKey: tripsKeys.all(scopeKey) });
      notificationService.success(data.message);
    },
    onError: () => {
      notificationService.error("Assignation impossible");
    },
  });
}
