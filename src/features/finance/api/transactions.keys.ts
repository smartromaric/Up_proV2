import type { ListParams } from "@/shared/types/listParams";

export const transactionsKeys = {
  all: ["finance", "transactions"] as const,
  list: (params?: ListParams) => [...transactionsKeys.all, "list", params] as const,
};
