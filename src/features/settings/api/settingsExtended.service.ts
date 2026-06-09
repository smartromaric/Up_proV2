import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  mapAuditLogListResponse,
  mapGeneralSettingsResponse,
  mapGeneralSettingsToApiBody,
  type ApiAuditLogListResponse,
  type ApiGeneralSettingsResponse,
} from "./adminSettings.mapper";

export interface PlatformIntegration {
  id: string;
  name: string;
  category: "payment" | "maps" | "messaging" | "monitoring";
  status: "connected" | "disconnected";
  last_sync_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor_email: string;
  action: string;
  resource: string;
  detail: string;
}

export interface GeneralSettings {
  platform_name: string;
  support_email: string;
  default_city: string;
  default_currency: string;
  default_locale: string;
  min_app_version_driver: string;
  min_app_version_client: string;
  maintenance_mode: boolean;
  updated_at: string;
}

export const settingsExtendedService = {
  integrations: () =>
    apiClient.get<{ data: PlatformIntegration[] }>("/admin/settings/integrations"),

  toggleIntegration: (id: string, connected: boolean) =>
    apiClient.patch<PlatformIntegration>(`/admin/settings/integrations/${id}`, {
      status: connected ? "connected" : "disconnected",
    }),

  auditLog: async (params?: ListParams): Promise<Paginated<AuditLogEntry>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<AuditLogEntry>>(
        `/admin/settings/audit${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiAuditLogListResponse>(
      `${LINKS.admin.v1.auditLog}${buildV1ListQuery(params)}`
    );
    return mapAuditLogListResponse(response, params);
  },

  general: async (): Promise<GeneralSettings> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<GeneralSettings>("/admin/settings/general");
    }

    const response = await apiClient.get<ApiGeneralSettingsResponse>(
      LINKS.admin.v1.settingsGeneral
    );
    return mapGeneralSettingsResponse(response);
  },

  updateGeneral: async (payload: Partial<GeneralSettings>) => {
    if (useLegacyAdminApi()) {
      return apiClient.put<GeneralSettings>("/admin/settings/general", payload);
    }

    const response = await apiClient.put<ApiGeneralSettingsResponse>(
      LINKS.admin.v1.settingsGeneral,
      mapGeneralSettingsToApiBody(payload)
    );
    return mapGeneralSettingsResponse(response);
  },
};
