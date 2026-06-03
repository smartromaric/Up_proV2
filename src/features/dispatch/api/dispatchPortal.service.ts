import { apiClient } from "@/core/http/apiClient";
import type { DispatchConsoleData, LiveMapData, Trip } from "@/shared/types";

export interface DispatchBookPayload {
  from_label: string;
  to_label: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  client_name: string;
  client_phone: string;
  service: "taxi" | "delivery";
  payment_method: "cash" | "wallet" | "orange_money";
  notes?: string;
}

export const dispatchPortalService = {
  getConsole: () =>
    apiClient.get<DispatchConsoleData>("/dispatch/ops/console"),

  assignDriver: (tripId: string, driverId: number) =>
    apiClient.post<Trip>(`/dispatch/ops/trips/${tripId}/assign`, {
      driver_id: driverId,
    }),

  getLiveMap: () => apiClient.get<LiveMapData>("/dispatch/ops/map"),

  bookRide: (payload: DispatchBookPayload) =>
    apiClient.post<Trip>("/dispatch/bookings", payload),
};
