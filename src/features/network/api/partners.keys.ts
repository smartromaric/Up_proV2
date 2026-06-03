import type { ListParams } from "@/shared/types/listParams";

export const partnersKeys = {
  all: ["network", "partners"] as const,
  list: (filters?: ListParams) => [...partnersKeys.all, "list", filters] as const,
};
