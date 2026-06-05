import { apiClient } from "@/core/http/apiClient";
import { LINKS, withListQuery } from "@/core/api/links";
import type { LiveMapData, Paginated, PricingRule } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";

export interface PricingListResponse extends Paginated<PricingRule> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
}

export interface CreatePricingPayload {
  franchise_id: number | string;
  zone_name: string;
  service?: PricingRule["service"];
  base_fare_fcfa?: number;
  per_km_fcfa?: number;
  min_fare_fcfa?: number;
  surge_multiplier?: number;
  status?: PricingRule["status"];
}

export type UpdatePricingPayload = Omit<
  CreatePricingPayload,
  "zone_name" | "franchise_id"
> & {
  service?: PricingRule["service"];
};

export const pricingService = {
  list: (params?: ListParams) =>
    apiClient.get<PricingListResponse>(
      withListQuery(LINKS.admin.settings.pricing.list, params)
    ),

  get: (id: string) =>
    apiClient.get<PricingRule>(LINKS.admin.settings.pricing.getById(id)),

  create: (payload: CreatePricingPayload) =>
    apiClient.post<PricingRule>(LINKS.admin.settings.pricing.create, payload),

  update: (id: string, payload: UpdatePricingPayload) =>
    apiClient.put<PricingRule>(LINKS.admin.settings.pricing.update(id), payload),
};
