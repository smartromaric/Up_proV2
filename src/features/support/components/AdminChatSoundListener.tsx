"use client";

import { usePathname } from "next/navigation";
import { adminChatService } from "../api/adminChat.service";
import { adminChatKeys } from "../api/adminChat.keys";
import { useChatIncomingSound } from "../hooks/useChatIncomingSound";

const CHAT_LIST_PARAMS = { per_page: 50, type: "franchise" } as const;

export function AdminChatSoundListener() {
  const pathname = usePathname();
  const activeChatId =
    pathname.match(/\/admin\/support\/chat\/([^/]+)/)?.[1] ?? null;

  useChatIncomingSound({
    listQueryKey: adminChatKeys.list(CHAT_LIST_PARAMS),
    listQueryFn: () => adminChatService.listChats(CHAT_LIST_PARAMS),
    detailQueryKey: (id) => adminChatKeys.detail(id),
    detailQueryFn: (id) => adminChatService.getChat(id),
    activeChatId,
    isIncomingMessage: (role) => role === "reporter",
  });

  return null;
}
