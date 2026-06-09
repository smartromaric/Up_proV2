import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapSupportTicketsListResponse,
  type ApiSupportTicketsListResponse,
} from "./adminSupport.mapper";

export interface AdminSupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  reporter_name: string;
  franchise_name: string;
  dispute_id?: string;
  created_at: string;
  updated_at: string;
}

export const supportTicketsService = {
  list: async (params?: ListParams): Promise<Paginated<AdminSupportTicket>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<AdminSupportTicket>>(
        `/admin/support/tickets${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiSupportTicketsListResponse>(
      `${LINKS.admin.v1.supportTickets}${buildV1ListQuery(params)}`
    );
    return mapSupportTicketsListResponse(response, params);
  },
};
