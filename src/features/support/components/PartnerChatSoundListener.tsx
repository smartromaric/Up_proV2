"use client";

import { usePathname } from "next/navigation";
import { partnerSupportService } from "@/features/partner/api/support.service";
import { partnerSupportKeys } from "@/features/partner/api/support.queries";
import { useChatIncomingSound } from "../hooks/useChatIncomingSound";

const CHAT_LIST_PARAMS = { per_page: 50 } as const;

export function PartnerChatSoundListener() {
  const pathname = usePathname();
  const activeChatId =
    pathname.match(/\/partner\/support\/chat\/([^/]+)/)?.[1] ?? null;

  useChatIncomingSound({
    listQueryKey: partnerSupportKeys.chats(CHAT_LIST_PARAMS),
    listQueryFn: () => partnerSupportService.listChats(CHAT_LIST_PARAMS),
    detailQueryKey: (id) => partnerSupportKeys.chat(id),
    detailQueryFn: (id) => partnerSupportService.getChat(id),
    activeChatId,
    isIncomingMessage: (role) => role === "agent",
  });

  return null;
}
