import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { AdminRole, Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";

export interface ApiAdminRoleItem {
  id: string;
  code?: string;
  label?: string;
  scope?: string;
  description?: string;
  created_at?: string;
  users_count?: number;
  is_system?: boolean;
  permission_groups?: AdminRole["permission_groups"];
}

export interface ApiAdminRolesListResponse {
  status?: string;
  items?: ApiAdminRoleItem[];
  pagination?: ApiV1Pagination;
}

export function mapAdminRoleItem(item: ApiAdminRoleItem): AdminRole {
  return {
    id: item.id,
    name: item.label ?? item.code ?? "—",
    slug: item.code ?? item.id,
    description: item.description ?? "",
    users_count: item.users_count ?? 0,
    is_system: item.is_system ?? ["SUPER_ADMIN", "FRANCHISE_ADMIN", "PARTNER_ADMIN", "DRIVER", "CLIENT"].includes(item.code ?? ""),
    permission_groups: item.permission_groups ?? [],
  };
}

export function mapAdminRolesListResponse(
  response: ApiAdminRolesListResponse,
  params?: ListParams
): Paginated<AdminRole> {
  const mapped = (response.items ?? []).map(mapAdminRoleItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}
