"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import {
  playChatNotificationSound,
  unlockChatAudioOnInteraction,
} from "@/shared/lib/chatNotificationSound";

const CHAT_POLL_MS = 5000;
const NOTIFY_DEBOUNCE_MS = 1500;

interface ChatMessageLike {
  id: string;
  role: string;
  author?: string;
}

interface ChatListItemLike {
  id: string;
  unread_count: number;
  participant_name?: string;
  subject?: string;
}

interface UseChatIncomingSoundOptions {
  listQueryKey: readonly unknown[];
  listQueryFn: () => Promise<{ data: ChatListItemLike[] }>;
  detailQueryKey?: (chatId: string) => readonly unknown[];
  detailQueryFn?: (chatId: string) => Promise<{
    messages: ChatMessageLike[];
    participant_name?: string;
    subject?: string;
  }>;
  activeChatId: string | null;
  isIncomingMessage: (role: string) => boolean;
  pollIntervalMs?: number;
}

export function useChatIncomingSound({
  listQueryKey,
  listQueryFn,
  detailQueryKey,
  detailQueryFn,
  activeChatId,
  isIncomingMessage,
  pollIntervalMs = CHAT_POLL_MS,
}: UseChatIncomingSoundOptions) {
  const listReadyRef = useRef(false);
  const unreadTotalRef = useRef(0);
  const lastMessageByChatRef = useRef<Record<string, string>>({});
  const lastNotifyAtRef = useRef(0);

  useEffect(() => {
    unlockChatAudioOnInteraction();
  }, []);

  const notifyIncoming = (label: string) => {
    const now = Date.now();
    if (now - lastNotifyAtRef.current < NOTIFY_DEBOUNCE_MS) return;
    lastNotifyAtRef.current = now;
    playChatNotificationSound();
    notificationService.info(label, { duration: 4000 });
  };

  const { data: listData } = useQuery({
    queryKey: listQueryKey,
    queryFn: listQueryFn,
    refetchInterval: pollIntervalMs,
    refetchIntervalInBackground: true,
  });

  const { data: detailData } = useQuery({
    queryKey:
      activeChatId && detailQueryKey
        ? detailQueryKey(activeChatId)
        : (["chat-incoming-sound", "detail-disabled"] as const),
    queryFn: () => detailQueryFn!(activeChatId!),
    enabled: Boolean(activeChatId && detailQueryFn && detailQueryKey),
    refetchInterval: pollIntervalMs,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const chats = listData?.data ?? [];
    const totalUnread = chats.reduce((sum, c) => sum + c.unread_count, 0);

    if (!listReadyRef.current) {
      unreadTotalRef.current = totalUnread;
      listReadyRef.current = true;
      return;
    }

    if (totalUnread > unreadTotalRef.current) {
      const withUnread = chats.filter((c) => c.unread_count > 0);
      const top = withUnread.sort((a, b) => b.unread_count - a.unread_count)[0];
      const name = top?.participant_name ?? top?.subject;
      notifyIncoming(
        name ? `Nouveau message — ${name}` : "Nouveau message dans le chat"
      );
    }

    unreadTotalRef.current = totalUnread;
  }, [listData]);

  useEffect(() => {
    if (!activeChatId || !detailData?.messages?.length) return;

    const messages = detailData.messages;
    const last = messages[messages.length - 1];
    if (!last) return;

    const prevId = lastMessageByChatRef.current[activeChatId];

    if (prevId === undefined) {
      lastMessageByChatRef.current[activeChatId] = last.id;
      return;
    }

    if (last.id !== prevId) {
      lastMessageByChatRef.current[activeChatId] = last.id;
      if (isIncomingMessage(last.role)) {
        const name =
          detailData.participant_name ??
          detailData.subject ??
          last.author ??
          "Chat";
        notifyIncoming(`Nouveau message — ${name}`);
      }
    }
  }, [activeChatId, detailData, isIncomingMessage]);
}
