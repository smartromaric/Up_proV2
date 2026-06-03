import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface PlatformWallet {
  id: string;
  owner_type: "driver" | "partner" | "franchise";
  owner_id: number;
  owner_name: string;
  franchise_name: string;
  balance_fcfa: number;
  pending_fcfa: number;
  status: "active" | "frozen";
}

export const walletsService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<PlatformWallet>>(
      `/admin/finance/wallets${buildListQuery(params)}`
    ),
};
