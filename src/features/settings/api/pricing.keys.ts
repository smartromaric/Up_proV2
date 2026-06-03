import type { ListParams } from "@/shared/types/listParams";

export const pricingKeys = {
  all: ["pricing"] as const,
  list: (filters?: ListParams) => [...pricingKeys.all, "list", filters] as const,
  detail: (id: string) => [...pricingKeys.all, "detail", id] as const,
};
