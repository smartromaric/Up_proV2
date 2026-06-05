import { apiClient } from "@/core/http/apiClient";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { driverDetailService } from "@/features/fleet/api/driverDetail.service";
import { fetchAdminKycDocuments } from "@/features/fleet/api/kyc.service";
import { mapAdminKycToPaginated } from "@/features/fleet/api/adminKyc.mapper";
import type { ApiAdminDriverItem } from "@/features/fleet/api/adminDrivers.api.types";
import type { Driver, DriverDetail, KycQueueItem, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiV1FranchiseDriversResponse } from "@/features/network/api/adminFranchises.api.types";
import { mapFranchiseDriversToPaginated } from "./franchisePortal.mapper";

export const franchiseDriversService = {
  list: async (params?: ListParams): Promise<Paginated<Driver>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<Driver>>(
        `${LINKS.franchise.drivers.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const response = await apiClient.get<ApiV1FranchiseDriversResponse>(
      `${LINKS.admin.franchises.drivers(franchiseId)}${buildV1ListQuery(params)}`
    );
    const items = (response.items ?? []) as ApiAdminDriverItem[];
    return mapFranchiseDriversToPaginated(items, params, response.pagination);
  },

  kycQueue: async (params?: ListParams): Promise<Paginated<KycQueueItem>> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<Paginated<KycQueueItem>>(
        `${LINKS.franchise.drivers.kycQueue.list}${buildListQuery(params)}`
      );
    }

    const franchiseId = await resolveFranchiseId();
    const [documents, drivers] = await Promise.all([
      fetchAdminKycDocuments(),
      apiClient.get<ApiV1FranchiseDriversResponse>(
        `${LINKS.admin.franchises.drivers(franchiseId)}${buildV1ListQuery({ page: 1, per_page: 200 })}`
      ),
    ]);
    const driverIds = new Set((drivers.items ?? []).map((d) => d.id));
    const scoped = (documents ?? []).filter((doc) =>
      driverIds.has(String(doc.subject_id ?? ""))
    );
    const driversById = new Map<string, ApiAdminDriverItem>(
      (drivers.items ?? []).map((d) => [d.id, d as ApiAdminDriverItem])
    );
    return mapAdminKycToPaginated(scoped, driversById, params);
  },

  getById: (id: string) =>
    useLegacyPortalApi()
      ? apiClient.get<DriverDetail>(`${LINKS.franchise.drivers.getById(id)}`)
      : driverDetailService.getById(id),

  approveKyc: (id: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.kycApprove(id)
        : `/v1/admin/drivers/${id}/approve`
    ),

  rejectKyc: (id: string, reason: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.kycReject(id)
        : `/v1/admin/drivers/${id}/reject`,
      { reason }
    ),

  approveDocument: (driverId: string, docId: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.documentApprove(driverId, docId)
        : LINKS.admin.v1.kycApprove(docId)
    ),

  rejectDocument: (driverId: string, docId: string, reason: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      useLegacyPortalApi()
        ? LINKS.franchise.drivers.documentReject(driverId, docId)
        : LINKS.admin.v1.kycReject(docId),
      { reason }
    ),
};
