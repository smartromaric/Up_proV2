"use client";

import { useQuery } from "@tanstack/react-query";
import type { ListParams } from "@/shared/types/listParams";
import { franchiseCommissionsService } from "./commissions.service";

export const franchiseCommissionsKeys = {
  all: ["franchise", "commissions"] as const,
  list: (params?: ListParams & { partner_id?: number }) =>
    [...franchiseCommissionsKeys.all, "list", params] as const,
};

export function useFranchiseCommissionsList(
  params?: ListParams & { partner_id?: number }
) {
  return useQuery({
    queryKey: franchiseCommissionsKeys.list(params),
    queryFn: () => franchiseCommissionsService.list(params),
  });
}
