import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchiseReconciliationRow {
  id: string;
  date_label: string;
  source: string;
  partner_id?: number;
  partner_name?: string;
  expected_fcfa: number;
  received_fcfa: number;
  delta_fcfa: number;
  status: "matched" | "discrepancy" | "pending";
}

export interface FranchiseReconciliationListResponse
  extends Paginated<FranchiseReconciliationRow> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
}

export const franchiseReconciliationService = {
  list: (params?: ListParams) =>
    apiClient.get<FranchiseReconciliationListResponse>(
      `/franchise/finance/reconciliation${buildListQuery(params)}`
    ),
};
