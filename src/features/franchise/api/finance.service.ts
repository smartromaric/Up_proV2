import { apiClient } from "@/core/http/apiClient";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  Paginated,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchiseFinance {
  balance_fcfa: number;
  commission_month_fcfa: number;
  payouts_pending_fcfa: number;
  available_fcfa: number;
  transactions: {
    id: string;
    label: string;
    amount_fcfa: number;
    direction: "credit" | "debit";
    created_at: string;
  }[];
}

export interface FranchiseDriverRechargePayload {
  driver_id: number;
  amount_fcfa: number;
  note?: string;
}

export const franchiseFinanceService = {
  get: () => apiClient.get<FranchiseFinance>("/franchise/finance"),

  getDriverRechargeStats: () =>
    apiClient.get<PartnerDriverRechargeStats>(
      "/franchise/finance/driver-transfers/stats"
    ),

  listDriverTransfers: (params?: ListParams) =>
    apiClient.get<Paginated<PartnerDriverTransfer>>(
      `/franchise/finance/driver-transfers${buildListQuery(params)}`
    ),

  rechargeDriver: (payload: FranchiseDriverRechargePayload) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      transfer: PartnerDriverTransfer;
      finance: FranchiseFinance;
      stats: PartnerDriverRechargeStats;
    }>("/franchise/finance/driver-recharge", payload),
};
