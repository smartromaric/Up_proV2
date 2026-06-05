import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { PartnerDetail } from "@/shared/types";
import type { ApiV1PartnerDetailResponse } from "./adminPartnerDetail.api.types";
import { mapV1PartnerDetailToPartnerDetail } from "./adminPartnerDetail.mapper";

export const partnerDetailService = {
  getById: async (id: string | number): Promise<PartnerDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<PartnerDetail>(`/admin/network/partners/${id}`);
    }

    const [response, lookups] = await Promise.all([
      apiClient.get<ApiV1PartnerDetailResponse>(
        LINKS.admin.partners.getById(String(id))
      ),
      fetchNetworkLookups(),
    ]);

    return mapV1PartnerDetailToPartnerDetail(response, lookups);
  },
};
