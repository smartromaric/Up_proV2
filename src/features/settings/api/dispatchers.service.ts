import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type {
  DispatcherAccountDetail,
  Paginated,
  DispatcherAccount,
} from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapDispatcherDetail,
  mapDispatchersListResponse,
  type ApiDispatchersListResponse,
} from "./adminDispatchers.mapper";

export type DispatcherPayload = Omit<
  DispatcherAccountDetail,
  "id" | "zone_names" | "franchise_name" | "last_login_at"
> & { password?: string };

export const dispatchersService = {
  list: async (params?: ListParams): Promise<Paginated<DispatcherAccount>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<DispatcherAccount>>(
        `/admin/dispatchers${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiDispatchersListResponse>(
      `${LINKS.admin.v1.dispatchers}${buildV1ListQuery(params)}`
    );
    return mapDispatchersListResponse(response, params);
  },

  get: async (id: string): Promise<DispatcherAccountDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<DispatcherAccountDetail>(`/admin/dispatchers/${id}`);
    }

    const response = await apiClient.get<{ item?: Parameters<typeof mapDispatcherDetail>[0] }>(
      LINKS.admin.v1.dispatcherById(id)
    );
    if (!response.item) throw new Error("Dispatcher introuvable.");
    return mapDispatcherDetail(response.item);
  },

  create: (payload: DispatcherPayload) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<DispatcherAccountDetail>("/admin/dispatchers", payload);
    }
    return apiClient.post<DispatcherAccountDetail>(LINKS.admin.v1.dispatchers, payload);
  },

  update: (id: string, payload: Partial<DispatcherPayload>) => {
    if (useLegacyAdminApi()) {
      return apiClient.put<DispatcherAccountDetail>(`/admin/dispatchers/${id}`, payload);
    }
    return apiClient.patch(LINKS.admin.v1.dispatcherById(id), payload);
  },

  suspend: (id: string) => {
    if (useLegacyAdminApi()) {
      return apiClient.patch<DispatcherAccountDetail>(`/admin/dispatchers/${id}/suspend`);
    }
    return apiClient.patch(LINKS.admin.v1.dispatcherById(id), { status: "suspended" });
  },

  activate: (id: string) => {
    if (useLegacyAdminApi()) {
      return apiClient.patch<DispatcherAccountDetail>(`/admin/dispatchers/${id}/activate`);
    }
    return apiClient.patch(LINKS.admin.v1.dispatcherById(id), { status: "active" });
  },
};
