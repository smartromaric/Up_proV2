import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchisePromo {
  id: number;
  code: string;
  label: string;
  discount_pct: number;
  fixed_discount_fcfa?: number;
  uses_count: number;
  max_uses: number;
  status: "active" | "expired" | "draft";
  expires_at: string;
}

export interface FranchiseSupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  partner_name: string;
  created_at: string;
  updated_at: string;
}

export const franchisePromosService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<FranchisePromo>>(
      `/franchise/promos${buildListQuery(params)}`
    ),
};

export const franchiseSupportService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<FranchiseSupportTicket>>(
      `/franchise/support${buildListQuery(params)}`
    ),
};
