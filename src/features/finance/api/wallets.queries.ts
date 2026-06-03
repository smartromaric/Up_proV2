"use client";

import { useQuery } from "@tanstack/react-query";
import { walletsService } from "./wallets.service";
import type { ListParams } from "@/shared/types/listParams";

export const walletsKeys = {
  all: ["finance", "wallets"] as const,
  list: (filters?: ListParams) => [...walletsKeys.all, "list", filters] as const,
};

export function useWalletsList(params?: ListParams) {
  return useQuery({
    queryKey: walletsKeys.list(params),
    queryFn: () => walletsService.list(params),
  });
}
