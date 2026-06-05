import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated, Partner } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiAdminPartnersResponse } from "./adminPartners.api.types";
import { mapAdminPartnersToPaginated } from "./adminPartners.mapper";

export type PartnerCreatePayload = {
  name: string;
  franchise_id: number | string;
  city: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  status?: Partner["status"];
};

export const partnersService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<Partner>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Partner>>(
        `/admin/network/partners${buildListQuery(params)}`
      );
    }

    const [response, lookups] = await Promise.all([
      apiClient.get<ApiAdminPartnersResponse>(
        `${LINKS.admin.v1.partners}${buildV1ListQuery(params)}`
      ),
      fetchNetworkLookups(),
    ]);
    return mapAdminPartnersToPaginated(
      response.items ?? [],
      params,
      response.pagination,
      lookups
    );
  },

  create: (payload: PartnerCreatePayload) =>
    apiClient.post<Partner>("/admin/network/partners", payload),
};
