import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { TransactionsResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiFinanceListResponse,
  ApiFinanceTransactionDetailResponse,
  ApiFinanceTransactionItem,
} from "./adminFinance.api.types";
import {
  mapFinanceTransactionDetail,
  mapFinanceTransactionsResponse,
  type FinanceTransactionDetail,
} from "./adminFinance.mapper";

export const transactionsService = {
  getById: async (id: string): Promise<FinanceTransactionDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<FinanceTransactionDetail>(
        `/admin/finance/transactions/${id}`
      );
    }

    const response = await apiClient.get<ApiFinanceTransactionDetailResponse>(
      LINKS.admin.v1.finance.transactionById(id)
    );
    if (!response.transaction?.id) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    return mapFinanceTransactionDetail(response.transaction);
  },

  listAdmin: async (params?: ListParams): Promise<TransactionsResponse> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<TransactionsResponse>(
        `/admin/finance/transactions${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<
      ApiFinanceListResponse<ApiFinanceTransactionItem>
    >(`${LINKS.admin.v1.finance.transactions}${buildV1ListQuery(params)}`);

    return mapFinanceTransactionsResponse(response, params);
  },
};
