import type { ListParams } from "@/shared/types/listParams";

export const withdrawalsKeys = {
  all: ["finance", "withdrawals"] as const,
  list: (filters?: ListParams) => [...withdrawalsKeys.all, "list", filters] as const,
  detail: (id: string) => [...withdrawalsKeys.all, "detail", id] as const,
};
