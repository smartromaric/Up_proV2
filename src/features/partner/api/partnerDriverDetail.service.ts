import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
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
  getTrips: (partnerId: string | number, driverId: string) =>
    apiClient.get<Paginated<PartnerDriverTripRow>>(
      LINKS.partner.drivers.trips(partnerId, driverId)
    ),

  getWalletTransactions: (partnerId: string | number, driverId: string) =>
    apiClient.get<Paginated<PartnerDriverWalletTransaction>>(
      LINKS.partner.drivers.walletTransactions(partnerId, driverId)
    ),

  getLivePosition: (partnerId: string | number, driverId: string) =>
    apiClient.get<PartnerDriverLiveMap>(
      LINKS.partner.drivers.live(partnerId, driverId)
    ),
};

export const partnerLiveMapService = {
  get: (partnerId: string | number) =>
    apiClient.get<LiveMapData>(LINKS.partner.ops.map(partnerId)),
};
