"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withdrawalsKeys } from "./withdrawals.keys";
import { withdrawalsService } from "./withdrawals.service";
import type { ListParams } from "@/shared/types/listParams";

export function useWithdrawalsList(params?: ListParams) {
  return useQuery({
    queryKey: withdrawalsKeys.list(params),
    queryFn: () => withdrawalsService.listAdmin(params),
  });
}

export function useApproveWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawalsService.approve(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: withdrawalsKeys.all });
    },
  });
}

export function useRejectWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawalsService.reject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: withdrawalsKeys.all });
    },
  });
}
