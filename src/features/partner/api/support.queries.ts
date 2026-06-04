"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { partnerSupportService } from "./support.service";
import type { ListParams } from "@/shared/types/listParams";

export const partnerSupportKeys = {
  all: ["partner", "support"] as const,
  chats: (filters?: ListParams) =>
    [...partnerSupportKeys.all, "chats", filters] as const,
  chat: (id: string) => [...partnerSupportKeys.all, "chat", id] as const,
};

export function usePartnerSupportChats(params?: ListParams) {
  return useQuery({
    queryKey: partnerSupportKeys.chats(params),
    queryFn: () => partnerSupportService.listChats(params),
  });
}

export function usePartnerSupportChat(id: string) {
  return useQuery({
    queryKey: partnerSupportKeys.chat(id),
    queryFn: () => partnerSupportService.getChat(id),
    enabled: Boolean(id),
  });
}

export function useReplyPartnerChat(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => partnerSupportService.replyChat(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerSupportKeys.chat(id) });
      void qc.invalidateQueries({ queryKey: partnerSupportKeys.all });
      notificationService.success("Message envoyé");
    },
    onError: () => notificationService.error("Envoi impossible"),
  });
}
