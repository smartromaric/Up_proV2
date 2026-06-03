"use client";

import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: partnerShiftsKeys.list(params),
    queryFn: () => partnerShiftsService.list(params),
  });
}

export function usePartnerRecurringBookings(params?: ListParams) {
  return useQuery({
    queryKey: partnerRecurringKeys.list(params),
    queryFn: () => partnerRecurringService.list(params),
  });
}

export function usePartnerReports(params?: ListParams) {
  return useQuery({
    queryKey: partnerReportsKeys.list(params),
    queryFn: () => partnerReportsService.list(params),
  });
}
