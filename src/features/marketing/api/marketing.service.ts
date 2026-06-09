import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapMarketingBannersResponse,
  mapMarketingCampaignsResponse,
  mapMarketingPromosResponse,
  type ApiMarketingBannerItem,
  type ApiMarketingCampaignItem,
  type ApiMarketingListResponse,
} from "./adminMarketing.mapper";
import type { ApiPromotionsListResponse } from "./adminPromotions.mapper";

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
  promos: async (params?: ListParams): Promise<Paginated<MarketingPromo>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<MarketingPromo>>(
        `/admin/marketing/promos${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiPromotionsListResponse>(
      `${LINKS.admin.v1.marketing.promos}${buildV1ListQuery(params)}`
    );
    return mapMarketingPromosResponse(response, params);
  },

  createPromo: async (payload: Omit<MarketingPromo, "id" | "uses_count">) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<MarketingPromo>("/admin/marketing/promos", payload);
    }

    const discountType = payload.fixed_discount_fcfa ? "FIXED" : "PERCENT";
    const discountValue =
      payload.fixed_discount_fcfa ?? payload.discount_pct ?? 0;

    const response = await apiClient.post<{ item?: { id: string } }>(
      LINKS.admin.v1.marketing.promos,
      {
        code: payload.code,
        title: payload.label,
        discount_type: discountType,
        discount_value: discountValue,
        usage_limit: payload.max_uses || undefined,
        ends_at: payload.expires_at || undefined,
        active: payload.status === "active",
      }
    );

    return {
      ...payload,
      id: response.item?.id as unknown as number,
      uses_count: 0,
    };
  },

  campaigns: async (params?: ListParams) => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<MarketingCampaign>>(
        `/admin/marketing/campaigns${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiMarketingListResponse<ApiMarketingCampaignItem>
    >(`${LINKS.admin.v1.marketing.campaigns}${buildV1ListQuery(params)}`);
    return mapMarketingCampaignsResponse(response, params);
  },

  createCampaign: async (
    payload: Omit<MarketingCampaign, "id" | "sent_count" | "open_rate_pct">
  ) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<MarketingCampaign>(
        "/admin/marketing/campaigns",
        payload
      );
    }

    return apiClient.post<MarketingCampaign>(
      LINKS.admin.v1.marketing.campaigns,
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
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<MarketingBanner>>(
        `/admin/marketing/banners${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiMarketingListResponse<ApiMarketingBannerItem>
    >(`${LINKS.admin.v1.marketing.banners}${buildV1ListQuery(params)}`);
    return mapMarketingBannersResponse(response, params);
  },

  createBanner: async (
    payload: Omit<MarketingBanner, "id" | "impressions" | "clicks">
  ) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<MarketingBanner>(
        "/admin/marketing/banners",
        payload
      );
    }

    return apiClient.post<MarketingBanner>(
      LINKS.admin.v1.marketing.banners,
      {
        title: payload.title,
        placement: payload.placement,
        status: payload.status,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
      }
    );
  },
};
