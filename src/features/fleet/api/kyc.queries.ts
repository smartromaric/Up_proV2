"use client";

import { useQuery } from "@tanstack/react-query";
import { kycKeys } from "./kyc.keys";
import { kycService } from "./kyc.service";
import type { ListParams } from "@/shared/types/listParams";

export function useKycQueue(params?: ListParams) {
  return useQuery({
    queryKey: kycKeys.queue(params),
    queryFn: () => kycService.getQueue(params),
  });
}
