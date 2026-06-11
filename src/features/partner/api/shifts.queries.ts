"use client";

import { useQuery } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import {
  partnerRecurringService,
  partnerReportsService,
  partnerShiftsService,
} from "./shifts.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerShiftsKeys = {
  all: ["partner", "shifts"] as const,
  list: (filters?: ListParams) => [...partnerShiftsKeys.all, "list", filters] as const,
};

export const partnerRecurringKeys = {
  all: ["partner", "bookings", "recurring"] as const,
  list: (filters?: ListParams) => [...partnerRecurringKeys.all, "list", filters] as const,
};

export const partnerReportsKeys = {
  all: ["partner", "reports"] as const,
  list: (filters?: ListParams) => [...partnerReportsKeys.all, "list", filters] as const,
};

export function usePartnerShifts(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerShiftsKeys.list(params),
    queryFn: () => partnerShiftsService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerRecurringBookings(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerRecurringKeys.list(params),
    queryFn: () => partnerRecurringService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerReports(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerReportsKeys.list(params),
    queryFn: () => partnerReportsService.list(ownerId!, params),
    enabled: ownerId != null,
  });
}
