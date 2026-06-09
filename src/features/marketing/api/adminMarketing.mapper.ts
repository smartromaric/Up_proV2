import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type {
  MarketingBanner,
  MarketingCampaign,
} from "./marketing.service";
import {
  mapPromotionItemToMarketingPromo,
  type ApiPromotionItem,
  type ApiPromotionsListResponse,
} from "./adminPromotions.mapper";

export interface ApiMarketingBannerItem {
  id: string | number;
  title?: string | null;
  placement?: string | null;
  status?: string | null;
  impressions?: number | null;
  clicks?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  start_at?: string | null;
  end_at?: string | null;
}

export interface ApiMarketingCampaignItem {
  id: string;
  name?: string | null;
  channel?: string | null;
  audience?: string | null;
  status?: string | null;
  sent_count?: number | null;
  open_rate_pct?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface ApiMarketingListResponse<T> {
  status?: string;
  items?: T[];
  banners?: T[];
  campaigns?: T[];
  pagination?: ApiV1Pagination;
}

function mapBannerStatus(value?: string | null): MarketingBanner["status"] {
  const key = String(value ?? "draft").toLowerCase();
  if (key === "active" || key === "published") return "active";
  if (key === "archived" || key === "inactive") return "archived";
  return "draft";
}

function mapCampaignStatus(
  value?: string | null
): MarketingCampaign["status"] {
  const key = String(value ?? "draft").toLowerCase();
  if (key === "running" || key === "active") return "running";
  if (key === "scheduled") return "scheduled";
  if (key === "completed" || key === "ended") return "completed";
  return "draft";
}

function mapCampaignChannel(
  value?: string | null
): MarketingCampaign["channel"] {
  const key = String(value ?? "push").toLowerCase();
  if (key === "sms") return "sms";
  if (key === "email") return "email";
  if (key === "in_app" || key === "in-app") return "in_app";
  return "push";
}

export function mapMarketingBannerItem(
  item: ApiMarketingBannerItem
): MarketingBanner {
  return {
    id: item.id as number,
    title: item.title?.trim() || "—",
    placement: item.placement?.trim() || "home_hero",
    status: mapBannerStatus(item.status),
    impressions: item.impressions ?? 0,
    clicks: item.clicks ?? 0,
    starts_at:
      item.starts_at ?? item.start_at ?? new Date().toISOString(),
    ends_at: item.ends_at ?? item.end_at ?? new Date().toISOString(),
  };
}

export function mapMarketingCampaignItem(
  item: ApiMarketingCampaignItem
): MarketingCampaign {
  return {
    id: item.id,
    name: item.name?.trim() || "—",
    channel: mapCampaignChannel(item.channel),
    audience: item.audience?.trim() || "Tous les clients",
    status: mapCampaignStatus(item.status),
    sent_count: item.sent_count ?? 0,
    open_rate_pct: item.open_rate_pct ?? 0,
    starts_at: item.starts_at ?? new Date().toISOString(),
    ends_at: item.ends_at ?? new Date().toISOString(),
  };
}

function mapMarketingList<TItem, TUi>(
  response: ApiMarketingListResponse<TItem>,
  params: ListParams | undefined,
  pickItems: (response: ApiMarketingListResponse<TItem>) => TItem[],
  mapItem: (item: TItem) => TUi
): Paginated<TUi> {
  const mapped = pickItems(response).map(mapItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}

export function mapMarketingBannersResponse(
  response: ApiMarketingListResponse<ApiMarketingBannerItem>,
  params?: ListParams
): Paginated<MarketingBanner> {
  return mapMarketingList(
    response,
    params,
    (r) => r.items ?? r.banners ?? [],
    mapMarketingBannerItem
  );
}

export function mapMarketingCampaignsResponse(
  response: ApiMarketingListResponse<ApiMarketingCampaignItem>,
  params?: ListParams
): Paginated<MarketingCampaign> {
  return mapMarketingList(
    response,
    params,
    (r) => r.items ?? r.campaigns ?? [],
    mapMarketingCampaignItem
  );
}

export function mapMarketingPromosResponse(
  response: ApiPromotionsListResponse,
  params?: ListParams
): Paginated<import("./marketing.service").MarketingPromo> {
  const mapped = (response.items ?? []).map(mapPromotionItemToMarketingPromo);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}

export type { ApiPromotionItem };
