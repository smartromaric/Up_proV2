"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerProfileService,
  type CreatePartnerDocumentPayload,
  type PartnerDocumentsSummary,
} from "./profile.service";
import { notificationService } from "@/core/http/notificationService";

export const partnerProfileKeys = {
  all: ["partner", "profile"] as const,
  detail: (id: string | number) => ["partner", "profile", id] as const,
  documents: (id: string | number) => ["partner", "profile", id, "documents"] as const,
};

export function usePartnerProfile() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerProfileKeys.detail(ownerId ?? "me"),
    queryFn: () =>
      ownerId ? partnerProfileService.get(ownerId) : partnerProfileService.me(),
    enabled: true, // me() fonctionne sans ownerId
  });
}

export function useUpdatePartnerProfile() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof partnerProfileService.update>[1], "partnerId">) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerProfileService.update(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerProfileKeys.all });
      void qc.invalidateQueries({ queryKey: partnerProfileKeys.detail(ownerId ?? "me") });
      notificationService.success("Profil mis à jour");
    },
    onError: () => {
      notificationService.error("Échec de la mise à jour");
    },
  });
}

export function usePartnerDocuments() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerProfileKeys.documents(ownerId ?? "me"),
    queryFn: () => partnerProfileService.listDocuments(ownerId!),
    enabled: ownerId != null,
  });
}

export function usePartnerDocumentsSummary() {
  const { ownerId } = useScope();
  return useQuery<PartnerDocumentsSummary | null>({
    queryKey: [...partnerProfileKeys.documents(ownerId ?? "me"), "summary"],
    queryFn: () => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerProfileService.getDocumentsSummary(ownerId);
    },
    enabled: ownerId != null,
  });
}

export function useUploadPartnerDocument() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: CreatePartnerDocumentPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerProfileService.uploadDocument(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: partnerProfileKeys.documents(ownerId ?? "me"),
      });
      notificationService.success("Document ajouté");
    },
    onError: () => notificationService.error("Échec de l'envoi du document"),
  });
}
