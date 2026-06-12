import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type {
  PartnerDriverRechargeStats,
  PartnerDriverTransfer,
  PartnerWallet,
  Paginated,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { DriverRechargeBatchPayload } from "@/features/finance/api/driverRecharge.v1.service";

interface WalletApiResponse {
  success: boolean;
  data?: {
    id?: number;
    partner_id?: number;
    balance_fcfa?: number;
    available_fcfa?: number;
    pending_withdrawal_fcfa?: number;
    currency?: string;
    last_withdrawal?: {
      id?: string;
      amount_fcfa?: number;
      status?: string;
      processed_at?: string;
    };
    recent_movements?: {
      id?: string;
      label?: string;
      amount_fcfa?: number;
      direction?: "credit" | "debit";
      created_at?: string;
    }[];
  };
}

function mapWalletResponse(response: WalletApiResponse | PartnerWallet): PartnerWallet {
  if ("success" in response && response.success && response.data) {
    const d = response.data;
    return {
      balance_fcfa: d.balance_fcfa ?? 0,
      available_fcfa: d.available_fcfa ?? 0,
      pending_withdrawal_fcfa: d.pending_withdrawal_fcfa ?? 0,
      last_withdrawal: d.last_withdrawal
        ? {
            id: d.last_withdrawal.id ?? "",
            amount_fcfa: d.last_withdrawal.amount_fcfa ?? 0,
            status: d.last_withdrawal.status ?? "",
            processed_at: d.last_withdrawal.processed_at ?? "",
          }
        : undefined,
      recent_movements:
        d.recent_movements?.map((m) => ({
          id: m.id ?? "",
          label: m.label ?? "",
          amount_fcfa: m.amount_fcfa ?? 0,
          direction: m.direction ?? "credit",
          created_at: m.created_at ?? "",
        })) ?? [],
    };
  }
  return response as PartnerWallet;
}

export interface DriverRechargePayload {
  driver_id: string | number;
  amount_fcfa: number;
  note?: string;
}

export interface LedgerEntry {
  id: string;
  label: string;
  amount_fcfa: number;
  direction: "credit" | "debit";
  balance_after_fcfa?: number;
  created_at: string;
}

export const partnerWalletService = {
  get: async (partnerId: string | number) => {
    const response = await apiClient.get<WalletApiResponse>(
      LINKS.partner.wallet.get(partnerId)
    );
    return mapWalletResponse(response);
  },

  ledger: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<LedgerEntry>>(
      `${LINKS.partner.wallet.ledger(partnerId)}${buildListQuery(params)}`
    ),

  settlements: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<unknown>>(
      `${LINKS.partner.wallet.settlements(partnerId)}${buildListQuery(params)}`
    ),

  revenue: (partnerId: string | number) =>
    apiClient.get<unknown>(LINKS.partner.wallet.revenue(partnerId)),

  withdraw: (partnerId: string | number, amount_fcfa: number) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      withdrawal_id: string;
      wallet: PartnerWallet;
    }>(LINKS.partner.wallet.withdraw(partnerId), { amount_fcfa }),

  getDriverRechargeStats: (partnerId: string | number) =>
    apiClient.get<PartnerDriverRechargeStats>(
      LINKS.partner.wallet.driverTransfers.stats(partnerId)
    ),

  listDriverTransfers: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<PartnerDriverTransfer>>(
      `${LINKS.partner.wallet.driverTransfers.list(partnerId)}${buildListQuery(params)}`
    ),

  rechargeDriver: (partnerId: string | number, payload: DriverRechargePayload) =>
    apiClient.post<{
      ok: boolean;
      message: string;
      transfer: PartnerDriverTransfer;
      wallet: PartnerWallet;
      stats: PartnerDriverRechargeStats;
    }>(LINKS.partner.wallet.driverRecharge(partnerId), {
      ...payload,
      driver_id: String(payload.driver_id),
    }),

  rechargeDrivers: async (
    partnerId: string | number,
    batch: DriverRechargeBatchPayload
  ) => {
    const ids = batch.driver_ids.map((id) => id.trim()).filter(Boolean);
    if (!ids.length) {
      throw new Error("Sélectionnez au moins un chauffeur.");
    }
    let last: Awaited<ReturnType<typeof partnerWalletService.rechargeDriver>>;
    for (const driver_id of ids) {
      last = await partnerWalletService.rechargeDriver(partnerId, {
        driver_id,
        amount_fcfa: batch.amount_fcfa,
        note: batch.note,
      });
    }
    return last!;
  },
};
