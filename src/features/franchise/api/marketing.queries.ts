"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import type { ListParams } from "@/shared/types/listParams";
import {
  franchiseMarketingService,
  type FranchiseBannerPayload,
  type FranchiseCampaignPayload,
} from "./marketing.service";

export const franchiseMarketingKeys = {
  all: ["franchise", "marketing"] as const,
  campaigns: (filters?: ListParams) =>
    [...franchiseMarketingKeys.all, "campaigns", filters] as const,
  banners: (filters?: ListParams) =>
    [...franchiseMarketingKeys.all, "banners", filters] as const,
};

export function useFranchiseCampaigns(params?: ListParams) {
  return useQuery({
    queryKey: franchiseMarketingKeys.campaigns(params),
    queryFn: () => franchiseMarketingService.campaigns(params),
  });
}

export function useCreateFranchiseCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseCampaignPayload) =>
      franchiseMarketingService.createCampaign(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchiseMarketingKeys.all });
      notificationService.success("Campagne créée");
    },
    onError: () => notificationService.error("Impossible de créer la campagne"),
  });
}

export function useFranchiseBanners(params?: ListParams) {
  return useQuery({
    queryKey: franchiseMarketingKeys.banners(params),
    queryFn: () => franchiseMarketingService.banners(params),
  });
}

export function useCreateFranchiseBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FranchiseBannerPayload) =>
      franchiseMarketingService.createBanner(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchiseMarketingKeys.all });
      notificationService.success("Bannière créée");
    },
    onError: () => notificationService.error("Impossible de créer la bannière"),
  });
}
