import { apiClient } from "@/core/http/apiClient";
import { ApiError } from "@/core/http/errorHandler";
import { resolveFranchiseId } from "@/core/api/franchiseContext.service";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
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
      appendQuery(
        LINKS.franchise.v1.drivers,
        buildV1ListQuery(params)
      )
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

    const [documents, drivers] = await Promise.all([
      fetchAdminKycDocuments(),
      apiClient.get<ApiV1FranchiseDriversResponse>(
        appendQuery(
          LINKS.franchise.v1.drivers,
          buildV1ListQuery({ page: 1, per_page: 200 })
        )
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

  getById: async (id: string): Promise<DriverDetail> => {
    if (useLegacyPortalApi()) {
      return apiClient.get<DriverDetail>(`${LINKS.franchise.drivers.getById(id)}`);
    }

    const franchiseId = await resolveFranchiseId();
    
    // Try V1 franchise endpoint first (if it exists)
    try {
      const response = await apiClient.get<{ status: string; driver: DriverDetail }>(LINKS.franchise.v1.driverById(franchiseId, id));
      console.log("V1 driver detail response:", response);
      // Extract driver from response and ensure kyc_documents is always an array
      const driver = response.driver;
      return {
        ...driver,
        kyc_documents: driver.kyc_documents || [],
      };
    } catch (err) {
      console.log("V1 endpoint failed:", err);
      // V1 endpoint doesn't exist, continue to fallback
    }
    
    // Fallback 1: Get driver from franchise list (which we know works)
    try {
      const driverList = await franchiseDriversService.list({ page: 1, per_page: 500 });
      const driverFromList = driverList.data.find((d) => String(d.id) === id);
      
      if (driverFromList) {
        // Fetch KYC documents for this driver
        let kycDocuments: DriverDetail["kyc_documents"] = [];
        try {
          const kycDocs = await fetchAdminKycDocuments({ subject_id: id, subject_type: "DRIVER" });
          const { mapApiKycItemsForDriver } = await import("@/features/fleet/api/kycDocument.mapper");
          kycDocuments = mapApiKycItemsForDriver(kycDocs, id);
        } catch {
          // KYC fetch failed, continue with empty documents
        }
        
        // Map to DriverDetail with defaults for missing fields
        return {
          ...driverFromList,
          rating: driverFromList.rating ?? 0,
          registered_at: new Date().toISOString(),
          approved_at: null,
          stats: {
            trips_total: 0,
            trips_completed: 0,
            trips_cancelled: 0,
            acceptance_rate_pct: 0,
            wallet_balance_fcfa: 0,
          },
          timeline: [],
          kyc_documents: kycDocuments,
        } as DriverDetail;
      }
    } catch {
      // List failed too, continue to next fallback
    }
    
    // Fallback 2: Try global driver detail service
    try {
      const { driverDetailService } = await import("@/features/fleet/api/driverDetail.service");
      const driverDetail = await driverDetailService.getById(id);
      
      // Verify driver belongs to franchise
      const driverFranchiseId = driverDetail.franchise_id;
      if (driverFranchiseId && String(driverFranchiseId) !== String(franchiseId)) {
        throw new ApiError(404, { message: "Chauffeur introuvable dans ce territoire", code: "DRIVER_NOT_IN_FRANCHISE" });
      }
      
      // Ensure kyc_documents is always an array
      return {
        ...driverDetail,
        kyc_documents: driverDetail.kyc_documents || [],
      };
    } catch {
      // Final fallback failed
      throw new ApiError(404, { message: "Chauffeur introuvable", code: "DRIVER_NOT_FOUND" });
    }
  },

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
