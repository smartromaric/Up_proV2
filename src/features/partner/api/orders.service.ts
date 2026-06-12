import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated, TripStatus } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import {
  type ApiBookingItem,
  type PartnerBooking,
  mapApiBookingItemToPartnerBooking,
  mapApiStatusToTripStatus,
} from "./bookings.service";

/** Réponse brute de GET /v1/partners/{id}/trips */
export interface ApiPartnerTripItem {
  id: string;
  ref: string;
  status: string;
  driver?: { id: string; first_name?: string | null; last_name?: string | null } | null;
  vehicle?: { id: string; plate?: string | null } | null;
  from_label: string;
  to_label: string;
  amount_fcfa: number;
  created_at: string;
  completed_at?: string | null;
}

export interface ApiPartnerTripsResponse {
  status: string;
  generatedAt?: string;
  items: ApiPartnerTripItem[];
  counters?: {
    total: number;
    completed: number;
    cancelled: number;
    in_progress: number;
    requested: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapApiPartnerTripItemToPartnerBooking(item: ApiPartnerTripItem): PartnerBooking {
  const driverName = item.driver
    ? `${item.driver.first_name ?? ""} ${item.driver.last_name ?? ""}`.trim()
    : undefined;

  return {
    id: item.id,
    ref: item.ref,
    from_label: item.from_label,
    to_label: item.to_label,
    status: mapApiStatusToTripStatus(item.status),
    amount_fcfa: item.amount_fcfa,
    driver_id: item.driver?.id,
    driver_name: driverName || undefined,
    created_at: item.created_at,
    // Pas de client_name dans /trips — on laisse vide pour la cellule
    client_name: "",
    client_phone: undefined,
    payment_status: undefined,
  };
}

function mapTripsResponse(response: ApiPartnerTripsResponse): Paginated<PartnerBooking> {
  const rawItems = response.items ?? [];
  const items = rawItems.map(mapApiPartnerTripItemToPartnerBooking);
  return {
    data: items,
    meta: response.pagination
      ? {
          current_page: response.pagination.page,
          last_page: response.pagination.hasMore
            ? response.pagination.page + 1
            : response.pagination.page,
          per_page: response.pagination.limit,
          total: response.pagination.total,
        }
      : { current_page: 1, last_page: 1, per_page: 20, total: items.length },
  };
}

export const partnerOrdersService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<ApiPartnerTripsResponse>(
      `${LINKS.partner.trips.list(partnerId)}${buildListQuery(params)}`
    );
    return mapTripsResponse(response);
  },

  getById: async (partnerId: string | number, id: string) => {
    // Format détail inconnu — on essaie le format booking legacy
    const response = await apiClient.get<{ order?: ApiBookingItem }>(
      LINKS.partner.trips.getById(partnerId, id)
    );
    if (response.order) {
      return mapApiBookingItemToPartnerBooking(response.order);
    }
    throw new Error("Commande introuvable.");
  },
};
