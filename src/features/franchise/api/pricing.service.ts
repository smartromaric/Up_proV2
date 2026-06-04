import { apiClient } from "@/core/http/apiClient";
import { LINKS, withListQuery } from "@/core/api/links";
import type { Paginated, PricingRule } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";

export interface FranchisePricingSummary {
  franchise_name: string;
  active_count: number;
  draft_count: number;
}

export interface FranchisePricingListResponse extends Paginated<PricingRule> {
  summary: FranchisePricingSummary;
}

export interface FranchiseCreatePricingPayload {
  zone_name: string;
  service?: PricingRule["service"];
  base_fare_fcfa?: number;
  per_km_fcfa?: number;
  min_fare_fcfa?: number;
  surge_multiplier?: number;
  status?: PricingRule["status"];
}

export type FranchiseUpdatePricingPayload = Omit<
  FranchiseCreatePricingPayload,
  "zone_name"
>;

export const franchisePricingService = {
  list: (params?: ListParams) =>
    apiClient.get<FranchisePricingListResponse>(
      withListQuery(LINKS.franchise.pricing.list, params)
    ),

  get: (id: string) =>
    apiClient.get<PricingRule>(LINKS.franchise.pricing.getById(id)),

  create: (payload: FranchiseCreatePricingPayload) =>
    apiClient.post<PricingRule>(LINKS.franchise.pricing.create, payload),

  update: (id: string, payload: FranchiseUpdatePricingPayload) =>
    apiClient.put<PricingRule>(LINKS.franchise.pricing.update(id), payload),
};
