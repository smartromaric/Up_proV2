import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchAdminOrdersList } from "@/features/admin/api/adminEntityLookup.service";
import type { PartnerDetail } from "@/shared/types";
import type { ApiV1PartnerDriversResponse } from "./adminPartnerDrivers.api.types";
import type { ApiV1PartnerDetailResponse } from "./adminPartnerDetail.api.types";
import type {
  ApiV1PartnerLedgerResponse,
  ApiV1PartnerWalletResponse,
} from "./adminPartnerWallet.api.types";
import { mapV1PartnerDetailToPartnerDetail } from "./adminPartnerDetail.mapper";

async function fetchPartnerDrivers(
  partnerId: string
): Promise<ApiV1PartnerDriversResponse> {
  return apiClient.get<ApiV1PartnerDriversResponse>(
    `${LINKS.admin.partners.drivers(partnerId)}${buildV1ListQuery({
      page: 1,
      per_page: 100,
    })}`
  );
}

async function fetchPartnerOrders(partnerId: string) {
  return fetchAdminOrdersList({
    page: 1,
    per_page: 20,
    partner_id: partnerId,
  });
}

async function fetchPartnerWallet(partnerId: string) {
  return apiClient.get<ApiV1PartnerWalletResponse>(
    LINKS.admin.partners.wallet(partnerId)
  );
}

async function fetchPartnerLedger(partnerId: string) {
  return apiClient.get<ApiV1PartnerLedgerResponse>(
    `${LINKS.admin.partners.ledger(partnerId)}${buildV1ListQuery({
      page: 1,
      per_page: 10,
    })}`
  );
}

export const partnerDetailService = {
  getById: async (id: string | number): Promise<PartnerDetail> => {
    const partnerId = String(id);

    if (useLegacyAdminApi()) {
      return apiClient.get<PartnerDetail>(`/admin/network/partners/${id}`);
    }

    const [response, lookups, driversRes, ordersRes, walletRes, ledgerRes] =
      await Promise.all([
        apiClient.get<ApiV1PartnerDetailResponse>(
          LINKS.admin.partners.getById(partnerId)
        ),
        fetchNetworkLookups(),
        fetchPartnerDrivers(partnerId).catch(
          () => ({ items: [] }) as ApiV1PartnerDriversResponse
        ),
        fetchPartnerOrders(partnerId).catch(() => ({
          rides: [],
          deliveries: [],
        })),
        fetchPartnerWallet(partnerId).catch(
          () => ({ wallet: undefined }) as ApiV1PartnerWalletResponse
        ),
        fetchPartnerLedger(partnerId).catch(
          () => ({ items: [] }) as ApiV1PartnerLedgerResponse
        ),
      ]);

    const orderRows = [
      ...(ordersRes.rides ?? []),
      ...(ordersRes.deliveries ?? []),
      ...((ordersRes as { items?: typeof ordersRes.rides }).items ?? []),
    ];
    const orders = [
      ...new Map(orderRows.map((order) => [order.id, order])).values(),
    ];

    return mapV1PartnerDetailToPartnerDetail(response, lookups, {
      drivers: driversRes.items ?? [],
      orders,
      wallet: walletRes.wallet,
      ledger: ledgerRes.items ?? [],
    });
  },
};
