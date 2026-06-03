import type { ListParams } from "@/shared/types/listParams";

export const zonesKeys = {
  all: ["network", "zones"] as const,
  list: (filters?: ListParams) => [...zonesKeys.all, "list", filters] as const,
};
