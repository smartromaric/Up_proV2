import { apiClient } from "@/core/http/apiClient";
import { fetchCityLabelById } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";
import type { Franchise, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiAdminFranchisesListResponse } from "./adminFranchises.api.types";
import {
  mapDashboardFranchisesToPaginated,
  mapV1FranchisesToPaginated,
} from "./adminFranchises.mapper";
import { registerFranchisePortalAccount } from "./franchiseRegister.service";

export type FranchiseCreatePayload = {
  name: string;
  city: string;
  status: Franchise["status"];
  contact_email: string;
  contact_phone: string;
  /** Mot de passe du compte admin franchise (portail /franchise) */
  admin_password: string;
  /** Franchise cible — requis en API réelle (POST /v1/auth/franchise/register) */
  franchise_id?: string;
};

export type FranchiseCreateResponse = Omit<Franchise, "id"> & {
  id: string | number;
  contact_email: string;
  contact_phone: string;
  portal_login_email: string;
};

export const franchisesService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<Franchise>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Franchise>>(
        `/admin/network/franchises${buildListQuery(params)}`
      );
    }

    try {
      const native = await apiClient.get<ApiAdminFranchisesListResponse>(
        `${LINKS.admin.v1.franchises}${buildV1ListQuery(params)}`
      );
      const items = native.items ?? [];
      if (items.length > 0 || native.pagination) {
        return mapV1FranchisesToPaginated(items, params, native.pagination);
      }
    } catch {
      // Fallback dashboard + bootstrap villes
    }

    const [dashboard, cityById] = await Promise.all([
      apiClient.get<ApiAdminDashboardResponse>(LINKS.admin.v1.dashboard),
      fetchCityLabelById(),
    ]);
    const items = dashboard.dashboard?.filters?.options?.franchises ?? [];
    return mapDashboardFranchisesToPaginated(items, params, cityById);
  },

  create: async (payload: FranchiseCreatePayload) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<FranchiseCreateResponse>(
        "/admin/network/franchises",
        payload
      );
    }
    return registerFranchisePortalAccount(payload);
  },
};
