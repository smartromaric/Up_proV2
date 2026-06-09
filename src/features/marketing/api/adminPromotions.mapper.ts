import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { MarketingPromo } from "./marketing.service";

export interface ApiPromotionItem {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
  discount_type?: string;
  discount_value?: number;
  usage_limit?: number | null;
  uses_count?: number | null;
  ends_at?: string | null;
  active?: boolean;
}

export interface ApiPromotionsListResponse {
  status?: string;
  items?: ApiPromotionItem[];
  pagination?: ApiV1Pagination;
}

function mapPromoStatus(item: ApiPromotionItem): MarketingPromo["status"] {
  if (item.active === false) return "expired";
  if (item.ends_at && new Date(item.ends_at).getTime() < Date.now()) return "expired";
  return "active";
}

export function mapPromotionItemToMarketingPromo(item: ApiPromotionItem): MarketingPromo {
  const isPercent = String(item.discount_type ?? "").toUpperCase() === "PERCENT";
  return {
    id: item.id as unknown as number,
    code: item.code,
    label: item.title?.trim() || item.description?.trim() || item.code,
    discount_pct: isPercent ? item.discount_value ?? 0 : 0,
    fixed_discount_fcfa: isPercent ? undefined : item.discount_value ?? 0,
    uses_count: item.uses_count ?? 0,
    max_uses: item.usage_limit ?? 0,
    status: mapPromoStatus(item),
    expires_at: item.ends_at ?? "",
  };
}

export function mapPromotionsListResponse(
  response: ApiPromotionsListResponse,
  params?: ListParams
): Paginated<MarketingPromo> {
  const mapped = (response.items ?? []).map(mapPromotionItemToMarketingPromo);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}
