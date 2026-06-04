import pricingListSeed from "../data/pricing-list.json";
import type { Paginated, PricingRule } from "@/shared/types";
import { paginatedList, type ListQuery } from "./listQuery";

let pricingState: Paginated<PricingRule> = {
  data: pricingListSeed.data as PricingRule[],
  meta: pricingListSeed.meta,
};

export function getPricingRules(): PricingRule[] {
  return pricingState.data;
}

export function setPricingRules(data: PricingRule[]) {
  pricingState = {
    ...pricingState,
    data,
    meta: { ...pricingState.meta, total: data.length },
  };
}

export function getPricingState(): Paginated<PricingRule> {
  return pricingState;
}

export function setPricingState(next: Paginated<PricingRule>) {
  pricingState = next;
}

export function listPricingFiltered(
  query: ListQuery,
  options?: { franchiseId?: number; activeOnly?: boolean }
) {
  let list = [...pricingState.data];
  if (options?.franchiseId != null) {
    list = list.filter((p) => p.franchise_id === options.franchiseId);
  }
  if (options?.activeOnly) {
    list = list.filter((p) => p.status === "active");
  }
  return paginatedList(list, query);
}

export function findPricingRule(id: number): PricingRule | undefined {
  return pricingState.data.find((p) => p.id === id);
}

export function addPricingRule(
  rule: Omit<PricingRule, "id">
): PricingRule {
  const ids = pricingState.data.map((p) => p.id);
  const created: PricingRule = {
    ...rule,
    id: ids.length ? Math.max(...ids) + 1 : 1,
  };
  setPricingState({
    ...pricingState,
    data: [...pricingState.data, created],
    meta: { ...pricingState.meta, total: pricingState.data.length + 1 },
  });
  return created;
}

export function updatePricingRule(
  id: number,
  patch: Partial<Omit<PricingRule, "id" | "franchise_id" | "franchise_name" | "zone_name">>
): PricingRule | null {
  const idx = pricingState.data.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const current = pricingState.data[idx];
  const updated: PricingRule = { ...current, ...patch };
  const next = [...pricingState.data];
  next[idx] = updated;
  setPricingState({ ...pricingState, data: next });
  return updated;
}
