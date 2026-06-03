"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerDriversService } from "./drivers.service";
import type { CreateDriverPayload } from "./drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { KycDocument } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";

export const partnerDriversKeys = {
  all: ["partner", "drivers"] as const,
  list: (filters?: ListParams) => [...partnerDriversKeys.all, "list", filters] as const,
  detail: (id: string) => [...partnerDriversKeys.all, "detail", id] as const,
};

export function usePartnerDriversList(params?: ListParams) {
  return useQuery({
    queryKey: partnerDriversKeys.list(params),
    queryFn: () => partnerDriversService.list(params),
  });
}

export function usePartnerDriverDetail(id: string) {
  return useQuery({
    queryKey: partnerDriversKeys.detail(id),
    queryFn: () => partnerDriversService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePartnerDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      documents = [],
    }: {
      data: CreateDriverPayload;
      documents?: DriverDocumentFile[];
    }) => partnerDriversService.createWithDocuments(data, documents),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.all });
    },
  });
}

export function useUploadPartnerDriverDocument(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, file }: { type: KycDocument["type"]; file: File }) =>
      partnerDriversService.uploadDocument(driverId, type, file.name),
    onSuccess: (data) => {
      qc.setQueryData(partnerDriversKeys.detail(driverId), data);
      void qc.invalidateQueries({ queryKey: partnerDriversKeys.list() });
    },
  });
}
