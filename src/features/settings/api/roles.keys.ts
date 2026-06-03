import type { ListParams } from "@/shared/types/listParams";

export const rolesKeys = {
  all: ["roles"] as const,
  list: (filters?: ListParams) => [...rolesKeys.all, "list", filters] as const,
  detail: (id: string) => [...rolesKeys.all, "detail", id] as const,
};
