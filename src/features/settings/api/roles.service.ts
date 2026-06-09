import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { AdminRole, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapAdminRoleItem,
  mapAdminRolesListResponse,
  type ApiAdminRolesListResponse,
} from "./adminRoles.mapper";

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
  list: async (params?: ListParams): Promise<Paginated<AdminRole>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<AdminRole>>(
        `/admin/settings/roles${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiAdminRolesListResponse>(
      `${LINKS.admin.v1.roles}${buildV1ListQuery(params)}`
    );
    return mapAdminRolesListResponse(response, params);
  },

  get: async (id: string): Promise<AdminRole> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<AdminRole>(`/admin/settings/roles/${id}`);
    }

    try {
      const response = await apiClient.get<{ item?: Parameters<typeof mapAdminRoleItem>[0] }>(
        LINKS.admin.v1.roleById(id)
      );
      if (response.item) return mapAdminRoleItem(response.item);
    } catch {
      // fallback liste
    }

    const list = await rolesService.list({ per_page: 100 });
    const match = list.data.find((role) => String(role.id) === id);
    if (!match) throw new Error("Rôle introuvable.");
    return match;
  },

  create: async (payload: CreateRolePayload): Promise<AdminRole> => {
    if (useLegacyAdminApi()) {
      return apiClient.post<AdminRole>("/admin/settings/roles", payload);
    }

    const response = await apiClient.post<{ item?: Parameters<typeof mapAdminRoleItem>[0] }>(
      LINKS.admin.v1.roles,
      {
        label: payload.name,
        code: payload.slug,
        description: payload.description,
      }
    );

    if (response.item) return mapAdminRoleItem(response.item);

    return {
      id: payload.slug ?? payload.name,
      name: payload.name,
      slug: payload.slug ?? payload.name,
      description: payload.description ?? "",
      users_count: 0,
      is_system: false,
      permission_groups: payload.permission_groups ?? [],
    };
  },

  update: (id: string, payload: UpdateRolePayload) => {
    if (useLegacyAdminApi()) {
      return apiClient.put<AdminRole>(`/admin/settings/roles/${id}`, payload);
    }

    return apiClient.patch(LINKS.admin.v1.roleById(id), {
      label: payload.name,
      description: payload.description,
    });
  },
};
