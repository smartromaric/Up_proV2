"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { notificationService } from "@/core/http/notificationService";
import {
  partnerBookingsService,
  type CreateBookingPayload,
} from "./bookings.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerBookingsKeys = {
  all: ["partner", "bookings"] as const,
  list: (filters?: ListParams) => [...partnerBookingsKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerBookingsKeys.all, "detail", id] as const,
};

export function usePartnerBookingsList(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerBookingsKeys.list(params),
    queryFn: () => partnerBookingsService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerBookingDetail(id: string) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerBookingsKeys.detail(id),
    queryFn: () => partnerBookingsService.getById(ownerId!, id),
    enabled: ownerId != null && Boolean(id),
  });
}

export function useCreatePartnerBooking() {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: (data: CreateBookingPayload) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerBookingsService.create(ownerId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerBookingsKeys.all });
    },
  });
}

export function useCancelPartnerBooking(id: string) {
  const qc = useQueryClient();
  const { ownerId } = useScope();
  return useMutation({
    mutationFn: () => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerBookingsService.cancel(ownerId, id);
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: partnerBookingsKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: partnerBookingsKeys.list() });
      notificationService.success(data.message);
    },
  });
}

export const partnerRecurringKeys = {
  all: ["partner", "bookings", "recurring"] as const,
  list: (filters?: ListParams) => [...partnerRecurringKeys.all, "list", filters] as const,
};

export function usePartnerRecurringBookings(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRecurringKeys.list(params),
    queryFn: () => partnerBookingsService.listRecurring(ownerId!, params),
    enabled: ownerId != null,
  });
}
