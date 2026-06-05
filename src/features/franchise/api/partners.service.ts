import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { ApiV1FranchisePartnersResponse } from "@/features/network/api/adminFranchises.api.types";
import {
  mapAdminPartnerItemToPartner,
  mapAdminPartnersToPaginated,
} from "@/features/network/api/adminPartners.mapper";
import type { Paginated, Partner } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchisePartner extends Partner {
  revenue_month_fcfa?: number;
}

export interface FranchisePartnerDetail extends FranchisePartner {
  legal_name: string;
  address: string;
  created_at: string;
  vehicles_count: number;
}

export const franchisePartnersService = {
  list: async (params?: ListParams): Promise<Paginated<FranchisePartner>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<FranchisePartner>>(
        `${LINKS.franchise.partners.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const [response, lookups] = await Promise.all([
      apiClient.get<ApiV1FranchisePartnersResponse>(
        `${LINKS.admin.franchises.partners(franchiseId)}${buildV1ListQuery(params)}`
      ),
      fetchNetworkLookups(),
    ]);

    return mapAdminPartnersToPaginated(
      response.items ?? [],
      params,
      response.pagination,
      lookups
    ) as Paginated<FranchisePartner>;
  },

  getById: async (id: string): Promise<FranchisePartnerDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<FranchisePartnerDetail>(
        `${LINKS.franchise.partners.getById(id)}`
      );
    }

    const response = await apiClient.get<{
      status: string;
      partner: Parameters<typeof mapAdminPartnerItemToPartner>[0];
    }>(LINKS.admin.partners.getById(id));
    const base = mapAdminPartnerItemToPartner(response.partner);
    return {
      ...base,
      legal_name:
        response.partner.legal_name?.trim() ||
        response.partner.trade_name?.trim() ||
        base.name,
      address: "—",
      created_at: response.partner.created_at ?? new Date().toISOString(),
      vehicles_count: 0,
    };
  },
};
