"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { notificationService } from "@/core/http/notificationService";
import type { DispatchRules } from "@/shared/types";
import { dispatchRulesKeys } from "./dispatchRules.keys";
import { dispatchRulesService } from "./dispatchRules.service";

export function useDispatchRules() {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: dispatchRulesKeys.detail(scopeKey),
    queryFn: () => dispatchRulesService.get(),
  });
}

export function useUpdateDispatchRules() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (payload: Partial<DispatchRules>) =>
      dispatchRulesService.update(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchRulesKeys.all(scopeKey) });
      notificationService.success("Règles enregistrées");
    },
    onError: () => notificationService.error("Enregistrement impossible"),
  });
}
