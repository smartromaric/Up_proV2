import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS, createUrl } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { fetchAdminDriversList } from "@/features/admin/api/adminEntityLookup.service";
import type { KycQueueItem, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import { buildV1ListQuery, type ApiV1Pagination } from "@/core/api/v1Pagination";
import { hasListDateFilter } from "@/shared/lib/listDateRange";
import type {
  ApiAdminKycDocumentItem,
  ApiAdminKycDocumentsResponse,
  ApiAdminKycQueueItem,
  ApiAdminKycQueueResponse,
} from "./adminKyc.api.types";

const KYC_QUEUE_FETCH_ALL_MAX_PAGES = 50;

/** L’API v1 n’applique pas encore dateFrom/dateTo — on charge toutes les pages puis filtre côté client. */
async function fetchAllNativeKycQueueItems(
  params?: ListParams
): Promise<ApiAdminKycQueueItem[]> {
  const collected: ApiAdminKycQueueItem[] = [];
  const baseQuery: ListParams = {
    ...params,
    date_from: undefined,
    date_to: undefined,
    per_page: 100,
  };

  for (let page = 1; page <= KYC_QUEUE_FETCH_ALL_MAX_PAGES; page += 1) {
    const response = await apiClient.get<ApiAdminKycQueueResponse>(
      `${LINKS.admin.v1.kycQueue}${buildV1ListQuery({ ...baseQuery, page })}`
    );
    const batch = response.items ?? [];
    collected.push(...batch);

    const pagination: ApiV1Pagination | undefined = response.pagination;
    const hasMore =
      pagination?.hasMore === true ||
      pagination?.hasNext === true ||
      (pagination?.totalPages != null &&
        page < (pagination.totalPages ?? page));

    if (!hasMore || batch.length === 0) break;
  }

  return collected;
}
import {
  mapAdminKycToPaginated,
  mapNativeKycQueueToPaginated,
} from "./adminKyc.mapper";

export interface FetchKycDocumentsParams {
  subject_id?: string;
  subject_type?: string;
  status?: string;
}

export async function fetchAdminKycDocuments(
  filters?: FetchKycDocumentsParams
): Promise<ApiAdminKycDocumentItem[]> {
  const url = createUrl(LINKS.admin.v1.kycDocuments, {
    subject_id: filters?.subject_id,
    subject_type: filters?.subject_type ?? (filters?.subject_id ? "DRIVER" : undefined),
    status: filters?.status,
  });
  const response = await apiClient.get<ApiAdminKycDocumentsResponse>(url);
  return response.items ?? [];
}

export const kycService = {
  listDocuments: fetchAdminKycDocuments,

  approveDocument: (documentId: string) =>
    apiWithNotify.post(
      LINKS.admin.v1.kycApprove(documentId),
      undefined,
      "Document validé"
    ),

  rejectDocument: (documentId: string, reason: string) =>
    apiWithNotify.post(
      LINKS.admin.v1.kycReject(documentId),
      { rejection_reason: reason },
      "Document rejeté"
    ),

  getQueue: async (params?: ListParams): Promise<Paginated<KycQueueItem>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<KycQueueItem>>(
        `/admin/fleet/kyc${buildListQuery(params)}`
      );
    }

    const dateFilterActive = hasListDateFilter(params);

    try {
      if (dateFilterActive) {
        const allItems = await fetchAllNativeKycQueueItems(params);
        return mapNativeKycQueueToPaginated(allItems, params);
      }

      const queue = await apiClient.get<ApiAdminKycQueueResponse>(
        `${LINKS.admin.v1.kycQueue}${buildV1ListQuery(params)}`
      );
      const items = queue.items ?? [];
      if (items.length > 0 || queue.pagination) {
        return mapNativeKycQueueToPaginated(items, params, queue.pagination);
      }
    } catch {
      // Fallback composition documents + drivers
    }

    const [kyc, drivers] = await Promise.all([
      fetchAdminKycDocuments(),
      fetchAdminDriversList(),
    ]);
    const driversById = new Map(
      (drivers.items ?? []).map((d) => [d.id, d])
    );
    return mapAdminKycToPaginated(kyc, driversById, params);
  },
};
