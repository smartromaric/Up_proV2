"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionsKeys } from "./transactions.keys";
import { transactionsService } from "./transactions.service";
import type { ListParams } from "@/shared/types/listParams";

export function useTransactionsList(params?: ListParams) {
  return useQuery({
    queryKey: transactionsKeys.list(params),
    queryFn: () => transactionsService.listAdmin(params),
  });
}
