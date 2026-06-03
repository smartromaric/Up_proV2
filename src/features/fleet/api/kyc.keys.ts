import type { ListParams } from "@/shared/types/listParams";

export const kycKeys = {
  all: ["fleet", "kyc"] as const,
  queue: (filters?: ListParams) => [...kycKeys.all, "queue", filters] as const,
};
