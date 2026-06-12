"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminChatKeys } from "./adminChat.keys";
import { adminChatService } from "./adminChat.service";
import type { ListParams } from "@/shared/types/listParams";

/** Pas de socket chat documenté — rafraîchissement type « live » par polling. */
export const ADMIN_CHAT_POLL_MS = 5_000;

export function useAdminSupportChats(params?: ListParams) {
  return useQuery({
    queryKey: adminChatKeys.list(params),
    queryFn: () => adminChatService.listChats(params),
    refetchInterval: ADMIN_CHAT_POLL_MS,
    refetchIntervalInBackground: true,
  });
}

export function useAdminSupportChat(chatId: string) {
  return useQuery({
    queryKey: adminChatKeys.detail(chatId),
    queryFn: () => adminChatService.getChat(chatId),
    refetchInterval: ADMIN_CHAT_POLL_MS,
    refetchIntervalInBackground: true,
  });
}

export function useReplyAdminChat(chatId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => adminChatService.replyChat(chatId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminChatKeys.detail(chatId) });
      void qc.invalidateQueries({ queryKey: adminChatKeys.all });
    },
  });
}
