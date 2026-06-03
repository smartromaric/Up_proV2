import { apiClient } from "@/core/http/apiClient";
import type { AdminRole, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface CreateRolePayload {
  name: string;
  description?: string;
  slug?: string;
  permission_groups?: AdminRole["permission_groups"];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permission_groups?: AdminRole["permission_groups"];
}

export const rolesService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<AdminRole>>(
      `/admin/settings/roles${buildListQuery(params)}`
    ),
  get: (id: string) => apiClient.get<AdminRole>(`/admin/settings/roles/${id}`),
  create: (payload: CreateRolePayload) =>
    apiClient.post<AdminRole>("/admin/settings/roles", payload),
  update: (id: string, payload: UpdateRolePayload) =>
    apiClient.put<AdminRole>(`/admin/settings/roles/${id}`, payload),
};
