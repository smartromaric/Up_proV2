import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useScope } from "@/core/auth/useScope";
import { partnerSafetyService, type AcknowledgeSosPayload } from "./safety.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerSafetyKeys = {
  all: ["partner", "safety"] as const,
  sosList: (filters?: ListParams) => [...partnerSafetyKeys.all, "sos", "list", filters] as const,
  sosDetail: (id: string | number) => [...partnerSafetyKeys.all, "sos", "detail", id] as const,
  dashboard: () => [...partnerSafetyKeys.all, "dashboard"] as const,
};

export function usePartnerSosList(params?: ListParams) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSafetyKeys.sosList(params),
    queryFn: () => partnerSafetyService.listSos(ownerId!, params),
    enabled: ownerId != null,
  });
}

export function usePartnerSosDetail(sosId: string | number) {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSafetyKeys.sosDetail(sosId),
    queryFn: () => partnerSafetyService.getSosById(ownerId!, sosId),
    enabled: ownerId != null && sosId != null,
  });
}

export function usePartnerSosDashboard() {
  const { ownerId } = useScope();
  return useQuery({
    queryKey: partnerSafetyKeys.dashboard(),
    queryFn: () => partnerSafetyService.getDashboard(ownerId!),
    enabled: ownerId != null,
    refetchInterval: 30000, // Refresh every 30s for live dashboard
  });
}

export function useAcknowledgeSos() {
  const qc = useQueryClient();
  const { ownerId } = useScope();

  return useMutation({
    mutationFn: ({ sosId, data }: { sosId: string | number; data?: AcknowledgeSosPayload }) => {
      if (!ownerId) throw new Error("Partner ID non disponible");
      return partnerSafetyService.acknowledgeSos(ownerId, sosId, data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerSafetyKeys.all });
    },
  });
}
