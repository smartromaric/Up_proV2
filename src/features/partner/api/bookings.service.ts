import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated, TripStatus, TripTimelineEvent } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface CreateBookingPayload {
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
  scheduled_at?: string;
  notes?: string;
}

export interface ApiBookingItem {
  id: string;
  order_reference?: string | null;
  client_id?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  franchise_id?: string | null;
  city_id?: string | null;
  zone_id?: string | null;
  service_type?: string | null;
  category_code?: string | null;
  status: string;
  payment_status?: string | null;
  payment_method_code?: string | null;
  pickup_address?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  dropoff_address?: string | null;
  dropoff_latitude?: number | null;
  dropoff_longitude?: number | null;
  scheduled_at?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  estimated_price_xof?: number | null;
  final_price_xof?: number | null;
  option_codes?: string[] | null;
  passenger_count?: number | null;
  notes?: string | null;
  metadata?: {
    clientName?: string | null;
    clientPhone?: string | null;
    service?: string | null;
    booking?: boolean;
    recurring?: boolean;
    createdFrom?: string | null;
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

export interface PartnerBooking {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  from_lat?: number;
  from_lng?: number;
  to_lat?: number;
  to_lng?: number;
  client_name: string;
  client_phone?: string;
  service?: "taxi" | "delivery";
  payment_method?: CreateBookingPayload["payment_method"];
  status: TripStatus;
  amount_fcfa?: number;
  driver_id?: string | number;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  created_at: string;
  payment_status?: string | null;
  category_code?: string | null;
  scheduled_at?: string | null;
}

export interface PartnerBookingDetail extends PartnerBooking {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  timeline: TripTimelineEvent[];
  estimated_arrival_at?: string | null;
}

export interface BookingCreated extends PartnerBooking {
  estimated_amount_fcfa: number;
}

export interface RecurringBooking {
  id: string;
  client_name: string;
  from_label: string;
  to_label: string;
  frequency: "daily" | "weekly" | "monthly";
  weekdays: string[];
  time: string;
  amount_fcfa: number;
  status: "active" | "paused";
  next_occurrence_at: string | null;
}

export function mapApiStatusToTripStatus(status?: string | null): TripStatus {
  const s = String(status ?? "").toLowerCase();
  if (s === "completed" || s === "done") return "completed";
  if (s === "in_progress" || s === "started") return "in_progress";
  if (s === "assigned" || s === "accepted") return "assigned";
  if (s === "arrived") return "arrived";
  if (s === "matching") return "matching";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "requested" || s === "pending") return "requested";
  return "requested";
}

export function mapApiBookingItemToPartnerBooking(item: ApiBookingItem): PartnerBooking {
  const meta = item.metadata ?? {};
  return {
    id: item.id,
    ref: item.order_reference || `TR-${item.id.slice(0, 8).toUpperCase()}`,
    from_label: item.pickup_address || "—",
    to_label: item.dropoff_address || "—",
    from_lat: item.pickup_latitude ?? undefined,
    from_lng: item.pickup_longitude ?? undefined,
    to_lat: item.dropoff_latitude ?? undefined,
    to_lng: item.dropoff_longitude ?? undefined,
    client_name: meta.clientName || `Client ${item.client_id?.slice(0, 6) ?? ""}`,
    client_phone: meta.clientPhone ?? undefined,
    service: meta.service === "delivery" ? "delivery" : "taxi",
    payment_method: item.payment_method_code === "wallet" ? "wallet" : item.payment_method_code === "orange_money" ? "orange_money" : "cash",
    status: mapApiStatusToTripStatus(item.status),
    amount_fcfa: item.estimated_price_xof ?? item.final_price_xof ?? undefined,
    driver_id: item.driver_id ?? undefined,
    driver_name: undefined, // Pas de nom driver dans la liste
    driver_phone: undefined,
    notes: item.notes ?? undefined,
    created_at: item.created_at,
    payment_status: item.payment_status,
    category_code: item.category_code,
    scheduled_at: item.scheduled_at ?? undefined,
  };
}

// Structure API brute (nouveau format backend)
export interface BookingsApiResponse {
  status: string;
  generatedAt?: string;
  items?: ApiBookingItem[];
  data?: ApiBookingItem[];
  bookings?: ApiBookingItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function mapBookingsResponse(response: BookingsApiResponse | Paginated<PartnerBooking>): Paginated<PartnerBooking> {
  if ("status" in response && response.status === "ok") {
    const rawItems = response.items ?? response.data ?? response.bookings ?? [];
    const items = rawItems.map(mapApiBookingItemToPartnerBooking);
    return {
      data: items,
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: items.length },
    };
  }
  if ("data" in response && Array.isArray(response.data)) {
    return response as Paginated<PartnerBooking>;
  }
  return response as Paginated<PartnerBooking>;
}

export const partnerBookingsService = {
  list: async (partnerId: string | number, params?: ListParams) => {
    const response = await apiClient.get<BookingsApiResponse>(
      `${LINKS.partner.bookings.list(partnerId)}${buildListQuery(params)}`
    );
    return mapBookingsResponse(response);
  },

  getById: async (partnerId: string | number, id: string) => {
    const response = await apiClient.get<PartnerBookingDetail>(
      LINKS.partner.bookings.getById(partnerId, id)
    );
    return response;
  },

  create: async (partnerId: string | number, data: CreateBookingPayload) => {
    const response = await apiClient.post<BookingCreated>(
      LINKS.partner.bookings.create(partnerId),
      data
    );
    return response;
  },

  cancel: async (partnerId: string | number, id: string) => {
    const response = await apiClient.post<{ ok: boolean; message: string; booking: PartnerBookingDetail }>(
      LINKS.partner.bookings.cancel(partnerId, id)
    );
    return response;
  },

  listRecurring: async (partnerId: string | number, params?: ListParams) => {
    interface RecurringApiResponse {
      status?: string;
      items?: RecurringBooking[];
      data?: RecurringBooking[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      };
    }
    const response = await apiClient.get<RecurringApiResponse>(
      `${LINKS.partner.bookings.recurring.list(partnerId)}${buildListQuery(params)}`
    );
    if ("status" in response && response.status === "ok" && response.items) {
      return {
        data: response.items,
        meta: response.pagination ? {
          current_page: response.pagination.page,
          last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
          per_page: response.pagination.limit,
          total: response.pagination.total,
        } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
      };
    }
    if ("data" in response && Array.isArray(response.data)) {
      return response as Paginated<RecurringBooking>;
    }
    return response as Paginated<RecurringBooking>;
  },
};
