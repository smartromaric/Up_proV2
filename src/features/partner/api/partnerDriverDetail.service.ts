import { apiClient } from "@/core/http/apiClient";
import type { LiveMapData, LiveMapDriver, Paginated, TripStatus } from "@/shared/types";

export interface PartnerDriverTripRow {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
}

export interface PartnerDriverWalletTransaction {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount_fcfa: number;
  balance_after_fcfa: number;
  created_at: string;
}

export interface PartnerDriverLiveMap {
  driver: LiveMapDriver;
  bounds: LiveMapData["bounds"];
  zone_name: string;
  city: string;
  updated_at: string;
}

export const partnerDriverDetailService = {
  getTrips: (id: string) =>
    apiClient.get<Paginated<PartnerDriverTripRow>>(`/partner/drivers/${id}/trips`),

  getWalletTransactions: (id: string) =>
    apiClient.get<Paginated<PartnerDriverWalletTransaction>>(
      `/partner/drivers/${id}/wallet/transactions`
    ),

  getLivePosition: (id: string) =>
    apiClient.get<PartnerDriverLiveMap>(`/partner/drivers/${id}/live`),
};

export const partnerLiveMapService = {
  get: () => apiClient.get<LiveMapData>("/partner/ops/map"),
};
