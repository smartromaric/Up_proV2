import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface MarketingPromo {
  id: number;
  code: string;
  label: string;
  discount_pct: number;
  fixed_discount_fcfa?: number;
  uses_count: number;
  max_uses: number;
  status: "active" | "expired" | "draft";
  expires_at: string;
}

export interface MarketingCampaign {
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

export interface MarketingBanner {
  id: number;
  title: string;
  placement: string;
  status: "active" | "archived" | "draft";
  impressions: number;
  clicks: number;
  starts_at: string;
  ends_at: string;
}

export const marketingService = {
  promos: (params?: ListParams) =>
    apiClient.get<Paginated<MarketingPromo>>(
      `/admin/marketing/promos${buildListQuery(params)}`
    ),
  createPromo: (payload: Omit<MarketingPromo, "id" | "uses_count">) =>
    apiClient.post<MarketingPromo>("/admin/marketing/promos", payload),
  campaigns: (params?: ListParams) =>
    apiClient.get<Paginated<MarketingCampaign>>(
      `/admin/marketing/campaigns${buildListQuery(params)}`
    ),
  createCampaign: (payload: Omit<MarketingCampaign, "id" | "sent_count" | "open_rate_pct">) =>
    apiClient.post<MarketingCampaign>("/admin/marketing/campaigns", payload),
  banners: (params?: ListParams) =>
    apiClient.get<Paginated<MarketingBanner>>(
      `/admin/marketing/banners${buildListQuery(params)}`
    ),
  createBanner: (payload: Omit<MarketingBanner, "id" | "impressions" | "clicks">) =>
    apiClient.post<MarketingBanner>("/admin/marketing/banners", payload),
};
