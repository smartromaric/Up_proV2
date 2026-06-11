"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { notificationService } from "@/core/http/notificationService";
import {
  partnerMembersService,
  type CreateMemberPayload,
  type UpdateMemberPayload,
} from "./members.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerMembersKeys = {
  all: ["partner", "members"] as const,
  list: (filters?: ListParams) => [...partnerMembersKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerMembersKeys.all, "detail", id] as const,
};

export function usePartnerMembersList(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerMembersKeys.list(params),
    queryFn: () => partnerMembersService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function useCreatePartnerMember() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: CreateMemberPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerMembersService.create(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerMembersKeys.all });
      notificationService.success("Membre ajouté");
    },
    onError: () => notificationService.error("Impossible d'ajouter le membre"),
  });
}

export function useUpdatePartnerMember(memberId: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: UpdateMemberPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerMembersService.update(ownerId, memberId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerMembersKeys.all });
      notificationService.success("Membre mis à jour");
    },
    onError: () => notificationService.error("Mise à jour impossible"),
  });
}

export function useDeletePartnerMember() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (memberId: string) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerMembersService.delete(ownerId, memberId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerMembersKeys.all });
      notificationService.success("Membre supprimé");
    },
    onError: () => notificationService.error("Suppression impossible"),
  });
}
