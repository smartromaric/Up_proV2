"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchisesKeys } from "./franchises.keys";
import {
  franchisesService,
  type FranchiseCreatePayload,
} from "./franchises.service";
import type { ListParams } from "@/shared/types/listParams";

export function useFranchisesList(params?: ListParams) {
  return useQuery({
    queryKey: franchisesKeys.list(params),
    queryFn: () => franchisesService.listAdmin(params),
  });
}

export function useCreateFranchise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseCreatePayload) => franchisesService.create(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: franchisesKeys.all });
      notificationService.success(
        `Franchise créée. Connexion portail : ${data.portal_login_email}`
      );
    },
    onError: (error: Error) =>
      notificationService.error(error.message || "Création impossible"),
  });
}
