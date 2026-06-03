import { apiClient } from "@/core/http/apiClient";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  PartnerWallet,
  Paginated,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface DriverRechargePayload {
  driver_id: number;
  amount_fcfa: number;
  note?: string;
}

export const partnerWalletService = {
  get: () => apiClient.get<PartnerWallet>("/partner/wallet"),

  withdraw: (amount_fcfa: number) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      withdrawal_id: string;
      wallet: PartnerWallet;
    }>("/partner/wallet/withdraw", { amount_fcfa }),

  getDriverRechargeStats: () =>
    apiClient.get<PartnerDriverRechargeStats>(
      "/partner/wallet/driver-transfers/stats"
    ),

  listDriverTransfers: (params?: ListParams) =>
    apiClient.get<Paginated<PartnerDriverTransfer>>(
      `/partner/wallet/driver-transfers${buildListQuery(params)}`
    ),

  rechargeDriver: (payload: DriverRechargePayload) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      transfer: PartnerDriverTransfer;
      wallet: PartnerWallet;
      stats: PartnerDriverRechargeStats;
    }>("/partner/wallet/driver-recharge", payload),
};
