import { apiClient } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapMarketingBannersResponse,
  mapMarketingCampaignsResponse,
  type ApiMarketingBannerItem,
  type ApiMarketingCampaignItem,
  type ApiMarketingListResponse,
} from "@/features/marketing/api/adminMarketing.mapper";

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
  campaigns: async (params?: ListParams) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchiseCampaign>>(
        `/franchise/marketing/campaigns${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiMarketingListResponse<ApiMarketingCampaignItem>
    >(`/v1/franchise/marketing/campaigns${buildV1ListQuery(params)}`);
    return mapMarketingCampaignsResponse(
      response,
      params
    ) as Paginated<FranchiseCampaign>;
  },

  createCampaign: (payload: FranchiseCampaignPayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<FranchiseCampaign>(
        "/franchise/marketing/campaigns",
        payload
      );
    }

    return apiClient.post<FranchiseCampaign>(
      "/v1/franchise/marketing/campaigns",
      {
        name: payload.name,
        channel: payload.channel,
        audience: payload.audience,
        status: payload.status,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
      }
    );
  },

  banners: async (params?: ListParams) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchiseBanner>>(
        `/franchise/marketing/banners${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiMarketingListResponse<ApiMarketingBannerItem>
    >(`/v1/franchise/marketing/banners${buildV1ListQuery(params)}`);
    return mapMarketingBannersResponse(
      response,
      params
    ) as Paginated<FranchiseBanner>;
  },

  createBanner: (payload: FranchiseBannerPayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<FranchiseBanner>(
        "/franchise/marketing/banners",
        payload
      );
    }

    return apiClient.post<FranchiseBanner>("/v1/franchise/marketing/banners", {
      title: payload.title,
      placement: payload.placement,
      status: payload.status,
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
    });
  },
};
