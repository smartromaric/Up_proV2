"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScopeQueryKey } from "@/core/auth/scopeQueryKey";
import { notificationService } from "@/core/http/notificationService";
import { dispatchersKeys } from "./dispatchers.keys";
import {
  dispatchersService,
  type DispatcherPayload,
} from "./dispatchers.service";
import type { ListParams } from "@/shared/types/listParams";

export function useDispatchersList(params?: ListParams) {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: dispatchersKeys.list(params, scopeKey),
    queryFn: () => dispatchersService.list(params),
  });
}

export function useDispatcherDetail(id: string, enabled = true) {
  const scopeKey = useScopeQueryKey();
  return useQuery({
    queryKey: dispatchersKeys.detail(id, scopeKey),
    queryFn: () => dispatchersService.get(id),
    enabled: enabled && id !== "new",
  });
}

export function useCreateDispatcher() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (payload: DispatcherPayload) => dispatchersService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all(scopeKey) });
      notificationService.success("Dispatcher créé");
    },
    onError: () => notificationService.error("Impossible de créer le dispatcher"),
  });
}

export function useUpdateDispatcher(id: string) {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (payload: Partial<DispatcherPayload>) =>
      dispatchersService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all(scopeKey) });
      notificationService.success("Modifications enregistrées");
    },
    onError: () => notificationService.error("Enregistrement impossible"),
  });
}

export function useSuspendDispatcher() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (id: string) => dispatchersService.suspend(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all(scopeKey) });
      notificationService.success("Compte suspendu");
    },
  });
}

export function useActivateDispatcher() {
  const qc = useQueryClient();
  const scopeKey = useScopeQueryKey();
  return useMutation({
    mutationFn: (id: string) => dispatchersService.activate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dispatchersKeys.all(scopeKey) });
      notificationService.success("Compte réactivé");
    },
  });
}
