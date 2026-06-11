"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { notificationService } from "@/core/http/notificationService";
import {
  partnerGpsService,
  type CreateGpsDevicePayload,
  type UpdateGpsDevicePayload,
} from "./gps.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerGpsKeys = {
  all: ["partner", "gps-devices"] as const,
  list: (filters?: ListParams) => [...partnerGpsKeys.all, "list", filters] as const,
};

export function usePartnerGpsDevices(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerGpsKeys.list(params),
    queryFn: () => partnerGpsService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function useCreateGpsDevice() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: CreateGpsDevicePayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerGpsService.create(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerGpsKeys.all });
      notificationService.success("Balise GPS ajoutée");
    },
    onError: () => notificationService.error("Impossible d'ajouter la balise"),
  });
}

export function useUpdateGpsDevice(deviceId: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: UpdateGpsDevicePayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerGpsService.update(ownerId, deviceId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerGpsKeys.all });
      notificationService.success("Balise GPS mise à jour");
    },
    onError: () => notificationService.error("Mise à jour impossible"),
  });
}

export function useDeleteGpsDevice() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (deviceId: string) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerGpsService.delete(ownerId, deviceId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerGpsKeys.all });
      notificationService.success("Balise GPS supprimée");
    },
    onError: () => notificationService.error("Suppression impossible"),
  });
}
