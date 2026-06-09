import { apiClient } from "@/core/http/apiClient";
import { fetchNetworkLookups } from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { FranchiseDetail } from "@/shared/types";
import type { ApiAdminFranchiseDetailResponse } from "@/features/settings/api/adminPlatformConfig.api.types";
import type {
  ApiV1FranchiseDetailResponse,
  ApiV1FranchiseDriversResponse,
  ApiV1FranchiseOrdersResponse,
  ApiV1FranchisePartnersResponse,
  ApiV1FranchiseRevenueResponse,
} from "./adminFranchises.api.types";
import { mapV1FranchiseDetail } from "./adminFranchises.mapper";
import type { ApiV1PartnerLedgerResponse } from "./adminPartnerWallet.api.types";
import {
  mapApiLedgerItemToMovement,
  mapApiPartnerWalletToUi,
} from "./adminPartnerWallet.mapper";
import type { ApiV1PartnerWalletResponse } from "./adminPartnerWallet.api.types";
import { zonesService } from "./zones.service";

export const franchiseDetailService = {
  getById: async (id: string | number): Promise<FranchiseDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<FranchiseDetail>(`/admin/network/franchises/${id}`);
    }

    const franchiseId = String(id);
    const lookups = await fetchNetworkLookups();

    const [adminDetail, profile, partners, drivers, revenue, franchiseZones, ordersRes, walletRes, ledgerRes] =
      await Promise.all([
        apiClient
          .get<ApiAdminFranchiseDetailResponse>(
            LINKS.admin.v1.franchiseById(franchiseId)
          )
          .catch(() => null),
        apiClient.get<ApiV1FranchiseDetailResponse>(
          LINKS.admin.franchises.getById(franchiseId)
        ),
        apiClient.get<ApiV1FranchisePartnersResponse>(
          LINKS.admin.franchises.partners(franchiseId)
        ),
        apiClient.get<ApiV1FranchiseDriversResponse>(
          LINKS.admin.franchises.drivers(franchiseId)
        ),
        apiClient.get<ApiV1FranchiseRevenueResponse>(
          LINKS.admin.franchises.revenue(franchiseId)
        ),
        zonesService.listByFranchise(franchiseId),
        apiClient
          .get<ApiV1FranchiseOrdersResponse>(
            `${LINKS.admin.franchises.orders(franchiseId)}${buildV1ListQuery({
              page: 1,
              per_page: 10,
            })}`
          )
          .catch(() => ({ orders: [] }) as ApiV1FranchiseOrdersResponse),
        apiClient
          .get<ApiV1PartnerWalletResponse>(
            LINKS.admin.franchises.wallet(franchiseId)
          )
          .catch(() => ({ wallet: undefined }) as ApiV1PartnerWalletResponse),
        apiClient
          .get<ApiV1PartnerLedgerResponse>(
            `${LINKS.admin.franchises.ledger(franchiseId)}${buildV1ListQuery({
              page: 1,
              per_page: 10,
            })}`
          )
          .catch(() => ({ items: [] }) as ApiV1PartnerLedgerResponse),
      ]);

    const profileForMap: ApiV1FranchiseDetailResponse = adminDetail?.franchise
      ? { status: "ok", franchise: adminDetail.franchise }
      : profile;

    const wallet = mapApiPartnerWalletToUi(
      walletRes.wallet,
      ledgerRes.items ?? []
    );
    const ledgerTransactions = (ledgerRes.items ?? []).map((item) => {
      const movement = mapApiLedgerItemToMovement(item);
      return {
        id: movement.id,
        label: movement.label,
        amount_fcfa:
          movement.direction === "debit"
            ? -movement.amount_fcfa
            : movement.amount_fcfa,
        created_at: movement.created_at,
      };
    });

    const detail = mapV1FranchiseDetail(
      profileForMap,
      partners,
      drivers,
      revenue,
      lookups,
      franchiseZones,
      {
        orders: ordersRes.orders ?? [],
        wallet,
        wallet_id:
          (adminDetail?.franchise as { wallet_id?: string | null } | undefined)
            ?.wallet_id ?? walletRes.wallet?.id ?? null,
        ledgerTransactions,
      }
    );

    const profileFranchise = profileForMap.franchise;
    const countryId =
      adminDetail?.franchise?.operating_country_id?.trim() ||
      adminDetail?.franchise?.country_id?.trim() ||
      profileFranchise.operating_country_id?.trim() ||
      profileFranchise.country_id?.trim();
    if (countryId) detail.country_id = countryId;

    if (adminDetail?.franchise) {
      const f = adminDetail.franchise;
      const city = f.cityLabel?.trim() || f.city?.trim();
      if (city) detail.city = city;
      if (adminDetail.summary?.partnersCount != null) {
        detail.partners_count = adminDetail.summary.partnersCount;
        detail.stats.partners_count = adminDetail.summary.partnersCount;
      }
      if (adminDetail.summary?.driversCount != null) {
        detail.drivers_count = adminDetail.summary.driversCount;
        detail.stats.drivers_count = adminDetail.summary.driversCount;
      }
      if (adminDetail.summary?.zonesCount != null) {
        detail.zones_count = adminDetail.summary.zonesCount;
        detail.stats.zones_count = adminDetail.summary.zonesCount;
      }
      if (
        adminDetail.summary?.revenueMonthXof != null &&
        adminDetail.summary.revenueMonthXof > 0
      ) {
        detail.revenue_month_fcfa = adminDetail.summary.revenueMonthXof;
        detail.stats.revenue_month_fcfa = adminDetail.summary.revenueMonthXof;
      }
    }

    return detail;
  },
};
