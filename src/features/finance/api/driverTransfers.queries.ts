"use client";

import { useQuery } from "@tanstack/react-query";
import { adminDriverTransfersService } from "./driverTransfers.service";
import type { ListParams } from "@/shared/types/listParams";

export function useAdminDriverRechargeStats() {
  return useQuery({
    queryKey: ["admin", "finance", "driver-transfers", "stats"],
    queryFn: () => adminDriverTransfersService.getStats(),
  });
}

export function useAdminDriverTransfers(params?: ListParams) {
  return useQuery({
    queryKey: ["admin", "finance", "driver-transfers", params],
    queryFn: () => adminDriverTransfersService.list(params),
  });
}
