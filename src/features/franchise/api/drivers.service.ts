import { apiClient } from "@/core/http/apiClient";
import type { Driver, DriverDetail, KycQueueItem, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export const franchiseDriversService = {
  list: (params?: ListParams) =>
    apiClient.get<Paginated<Driver>>(`/franchise/drivers${buildListQuery(params)}`),

  kycQueue: (params?: ListParams) =>
    apiClient.get<Paginated<KycQueueItem>>(
      `/franchise/drivers/kyc-queue${buildListQuery(params)}`
    ),

  getById: (id: string) => apiClient.get<DriverDetail>(`/franchise/drivers/${id}`),

  approveKyc: (id: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/franchise/drivers/${id}/kyc/approve`
    ),

  rejectKyc: (id: string, reason: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/franchise/drivers/${id}/kyc/reject`,
      { reason }
    ),

  approveDocument: (driverId: string, docId: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      `/franchise/drivers/${driverId}/documents/${docId}/approve`
    ),

  rejectDocument: (driverId: string, docId: string, reason: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      `/franchise/drivers/${driverId}/documents/${docId}/reject`,
      { reason }
    ),
};
