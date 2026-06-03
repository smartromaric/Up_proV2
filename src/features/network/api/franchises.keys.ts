import type { ListParams } from "@/shared/types/listParams";

export const franchisesKeys = {
  all: ["network", "franchises"] as const,
  list: (filters?: ListParams) => [...franchisesKeys.all, "list", filters] as const,
};
