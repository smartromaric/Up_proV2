"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  adminPlatformConfigService,
  isLegacyPlatformSettings,
} from "./adminPlatformConfig.service";
import type {
  PaydunyaConfigDocument,
  WeatherConfigDocument,
} from "./adminPlatformConfig.api.types";

export const platformConfigKeys = {
  all: ["settings", "platform-config"] as const,
  paydunya: () => [...platformConfigKeys.all, "paydunya"] as const,
  weather: () => [...platformConfigKeys.all, "weather"] as const,
};

export function usePaydunyaConfig() {
  return useQuery({
    queryKey: platformConfigKeys.paydunya(),
    queryFn: () => adminPlatformConfigService.getPaydunya(),
    enabled: !isLegacyPlatformSettings(),
  });
}

export function useUpdatePaydunyaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (document: PaydunyaConfigDocument) =>
      adminPlatformConfigService.updatePaydunya(document),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformConfigKeys.paydunya() });
      notificationService.success("Configuration PayDunya enregistrée");
    },
    onError: () => notificationService.error("Enregistrement PayDunya impossible"),
  });
}

export function useWeatherConfig() {
  return useQuery({
    queryKey: platformConfigKeys.weather(),
    queryFn: () => adminPlatformConfigService.getWeather(),
    enabled: !isLegacyPlatformSettings(),
  });
}

export function useUpdateWeatherConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (document: WeatherConfigDocument) =>
      adminPlatformConfigService.updateWeather(document),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformConfigKeys.weather() });
      notificationService.success("Configuration météo enregistrée");
    },
    onError: () => notificationService.error("Enregistrement météo impossible"),
  });
}

export function useRefreshWeather() {
  return useMutation({
    mutationFn: () => adminPlatformConfigService.refreshWeather(),
    onSuccess: (data) => {
      notificationService.success(
        data.queued
          ? `Refresh météo planifié (${data.jobId ?? "job"})`
          : "Refresh météo lancé"
      );
    },
    onError: () => notificationService.error("Refresh météo impossible"),
  });
}

export function useReconcilePaymentsBatch() {
  return useMutation({
    mutationFn: () => adminPlatformConfigService.reconcilePaymentsBatch(),
    onSuccess: (data) => {
      notificationService.success(
        `Réconciliation : ${data.scanned ?? 0} scannés, ${data.updated ?? 0} mis à jour`
      );
    },
    onError: () => notificationService.error("Réconciliation batch impossible"),
  });
}
