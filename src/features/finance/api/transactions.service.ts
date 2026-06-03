import { apiClient } from "@/core/http/apiClient";
import type { TransactionsResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const transactionsService = {
  listAdmin: (params?: ListParams) =>
    apiClient.get<TransactionsResponse>(
      `/admin/finance/transactions${buildListQuery(params)}`
    ),
};
