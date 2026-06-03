import { apiClient } from "@/core/http/apiClient";
import type { Paginated, Partner } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type PartnerCreatePayload = {
  name: string;
  franchise_id: number;
  city: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  status?: Partner["status"];
};

export const partnersService = {
  listAdmin: (params?: ListParams) =>
    apiClient.get<Paginated<Partner>>(
      `/admin/network/partners${buildListQuery(params)}`
    ),

  create: (payload: PartnerCreatePayload) =>
    apiClient.post<Partner>("/admin/network/partners", payload),
};
