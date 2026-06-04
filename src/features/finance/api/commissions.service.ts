import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface CommissionRow {
  id: string;
  period_label: string;
  franchise_id: number;
  franchise_name: string;
  trips_count: number;
  gross_fcfa: number;
  commission_fcfa: number;
  rate_pct: number;
  status: "pending" | "paid";
}

export interface CommissionsListResponse extends Paginated<CommissionRow> {
  filter_options: NonNullable<LiveMapData["filter_options"]>;
}

export interface ReconciliationRow {
  id: string;
  date_label: string;
  source: string;
  expected_fcfa: number;
  received_fcfa: number;
  delta_fcfa: number;
  status: "matched" | "discrepancy" | "pending";
}

export const commissionsService = {
  list: (params?: ListParams) =>
    apiClient.get<CommissionsListResponse>(
      `/admin/finance/commissions${buildListQuery(params)}`
    ),
};

export const reconciliationService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<ReconciliationRow>>(
      `/admin/finance/reconciliation${buildListQuery(params)}`
    ),
};
