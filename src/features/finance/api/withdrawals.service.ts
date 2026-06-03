import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import type { WithdrawalsResponse } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const withdrawalsService = {
  listAdmin: (params?: ListParams) =>
    apiClient.get<WithdrawalsResponse>(
      `/admin/finance/withdrawals${buildListQuery(params)}`
    ),

  approve: (id: string) =>
    apiWithNotify.post(
      `/admin/finance/withdrawals/${id}/approve`,
      undefined,
      "Retrait approuvé"
    ),

  reject: (id: string) =>
    apiWithNotify.post(
      `/admin/finance/withdrawals/${id}/reject`,
      undefined,
      "Retrait rejeté"
    ),
};
