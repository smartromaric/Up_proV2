import { apiClient } from "@/core/http/apiClient";
import type {
  FleetClient,
  FleetClientDetail,
} from "@/features/fleet/api/clients.service";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const franchiseClientsService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<FleetClient>>(
      `/franchise/fleet/clients${buildListQuery(params)}`
    ),
  get: (id: string) =>
    apiClient.get<FleetClientDetail>(`/franchise/fleet/clients/${id}`),
  suspend: (id: string) =>
    apiClient.post<{ ok: boolean; message: string }>(
      `/franchise/fleet/clients/${id}/suspend`
    ),
  activate: (id: string) =>
    apiClient.post<{ ok: boolean; message: string }>(
      `/franchise/fleet/clients/${id}/activate`
    ),
};
