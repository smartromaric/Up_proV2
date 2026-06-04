import { apiClient } from "@/core/http/apiClient";
import type { Franchise, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export type FranchiseCreatePayload = {
  name: string;
  city: string;
  status: Franchise["status"];
  contact_email: string;
  contact_phone: string;
  /** Mot de passe du compte admin franchise (portail /franchise) */
  admin_password: string;
};

export type FranchiseCreateResponse = Franchise & {
  contact_email: string;
  contact_phone: string;
  portal_login_email: string;
};

export const franchisesService = {
  listAdmin: (params?: ListParams) =>
    apiClient.get<Paginated<Franchise>>(
      `/admin/network/franchises${buildListQuery(params)}`
    ),

  create: (payload: FranchiseCreatePayload) =>
    apiClient.post<FranchiseCreateResponse>("/admin/network/franchises", payload),
};
