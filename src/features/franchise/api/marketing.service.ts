import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchiseCampaign {
  id: string;
  name: string;
  channel: "push" | "sms" | "in_app" | "email";
  audience: string;
  status: "running" | "scheduled" | "completed" | "draft";
  sent_count: number;
  open_rate_pct: number;
  starts_at: string;
  ends_at: string;
}

export interface FranchiseBanner {
  id: number;
  title: string;
  placement: string;
  status: "active" | "archived" | "draft";
  impressions: number;
  clicks: number;
  starts_at: string;
  ends_at: string;
}

export type FranchiseCampaignPayload = Omit<
  FranchiseCampaign,
  "id" | "sent_count" | "open_rate_pct"
>;

export type FranchiseBannerPayload = Omit<
  FranchiseBanner,
  "id" | "impressions" | "clicks"
>;

export const franchiseMarketingService = {
  campaigns: (params?: ListParams) =>
    apiClient.get<Paginated<FranchiseCampaign>>(
      `/franchise/marketing/campaigns${buildListQuery(params)}`
    ),
  createCampaign: (payload: FranchiseCampaignPayload) =>
    apiClient.post<FranchiseCampaign>("/franchise/marketing/campaigns", payload),
  banners: (params?: ListParams) =>
    apiClient.get<Paginated<FranchiseBanner>>(
      `/franchise/marketing/banners${buildListQuery(params)}`
    ),
  createBanner: (payload: FranchiseBannerPayload) =>
    apiClient.post<FranchiseBanner>("/franchise/marketing/banners", payload),
};
