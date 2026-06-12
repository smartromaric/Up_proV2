import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface PartnerMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "admin" | "operator" | "viewer";
  status: "active" | "inactive";
  created_at: string;
}

export interface UpdateMemberPayload {
  role?: PartnerMember["role"];
  status?: PartnerMember["status"];
}

export interface CreateMemberPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: PartnerMember["role"];
}

export const partnerMembersService = {
  list: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<PartnerMember>>(
      `${LINKS.partner.drivers.members.list(partnerId)}${buildListQuery(params)}`
    ),

  create: (partnerId: string | number, data: CreateMemberPayload) =>
    apiClient.post<PartnerMember>(
      LINKS.partner.drivers.members.create(partnerId),
      data
    ),

  update: (partnerId: string | number, memberId: string, data: UpdateMemberPayload) =>
    apiClient.patch<PartnerMember>(
      LINKS.partner.drivers.members.update(partnerId, memberId),
      data
    ),

  delete: (partnerId: string | number, memberId: string) =>
    apiClient.delete<{ ok: boolean }>(
      LINKS.partner.drivers.members.delete(partnerId, memberId)
    ),
};
