import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type {
  FleetClient,
  FleetClientDetail,
} from "@/features/fleet/api/clients.service";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const franchiseClientsService = {
  list: (params?: ListParams) =>
    useLegacyPortalApi()
      ? apiClient.get<Paginated<FleetClient>>(
          `/franchise/fleet/clients${buildListQuery(params)}`
        )
      : apiClient.get<Paginated<FleetClient>>(
          appendQuery(LINKS.franchise.v1.clients, buildV1ListQuery(params))
        ),
  get: (id: string) =>
    useLegacyPortalApi()
      ? apiClient.get<FleetClientDetail>(`/franchise/fleet/clients/${id}`)
      : apiClient.get<FleetClientDetail>(`${LINKS.franchise.v1.clients}/${id}`),
  suspend: (id: string) =>
    useLegacyPortalApi()
      ? apiClient.post<{ ok: boolean; message: string }>(`/franchise/fleet/clients/${id}/suspend`)
      : apiClient.post<{ ok: boolean; message: string }>(`${LINKS.franchise.v1.clients}/${id}/suspend`),
  activate: (id: string) =>
    useLegacyPortalApi()
      ? apiClient.post<{ ok: boolean; message: string }>(`/franchise/fleet/clients/${id}/activate`)
      : apiClient.post<{ ok: boolean; message: string }>(`${LINKS.franchise.v1.clients}/${id}/activate`),
};
