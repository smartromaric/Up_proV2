import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { AuditLogEntry, GeneralSettings } from "./settingsExtended.service";

export interface ApiGeneralSettingsResponse {
  status?: string;
  value?: {
    platform_name?: string;
    support_email?: string;
    default_city?: string;
    default_currency?: string;
    locales?: string[];
    maintenance?: boolean;
    min_app_version_driver?: string;
    min_app_version_client?: string;
    updated_at?: string;
  };
}

export interface ApiAuditLogItem {
  id: string;
  created_at?: string;
  actor_email?: string;
  actorEmail?: string;
  action?: string;
  resource?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiAuditLogListResponse {
  status?: string;
  items?: ApiAuditLogItem[];
  pagination?: ApiV1Pagination;
}

export function mapGeneralSettingsResponse(
  response: ApiGeneralSettingsResponse
): GeneralSettings {
  const value = response.value ?? {};
  const locale = value.locales?.[0] ?? "fr-FR";
  return {
    platform_name: value.platform_name ?? "UPJUNOO",
    support_email: value.support_email ?? "",
    default_city: value.default_city ?? "",
    default_currency: value.default_currency ?? "XOF",
    default_locale: locale,
    min_app_version_driver: value.min_app_version_driver ?? "",
    min_app_version_client: value.min_app_version_client ?? "",
    maintenance_mode: value.maintenance ?? false,
    updated_at: value.updated_at ?? new Date().toISOString(),
  };
}

export function mapGeneralSettingsToApiBody(payload: Partial<GeneralSettings>) {
  return {
    platform_name: payload.platform_name,
    support_email: payload.support_email,
    default_city: payload.default_city,
    default_currency: payload.default_currency,
    locales: payload.default_locale ? [payload.default_locale] : undefined,
    maintenance: payload.maintenance_mode,
    min_app_version_driver: payload.min_app_version_driver,
    min_app_version_client: payload.min_app_version_client,
  };
}

export function mapAuditLogItem(item: ApiAuditLogItem): AuditLogEntry {
  return {
    id: item.id,
    at: item.created_at ?? new Date().toISOString(),
    actor_email: item.actor_email ?? item.actorEmail ?? "—",
    action: item.action ?? "—",
    resource: item.resource ?? "—",
    detail: item.detail ?? JSON.stringify(item.metadata ?? {}),
  };
}

export function mapAuditLogListResponse(
  response: ApiAuditLogListResponse,
  params?: ListParams
): Paginated<AuditLogEntry> {
  const mapped = (response.items ?? []).map(mapAuditLogItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}
