"use client";

import { usePathname } from "next/navigation";
import { env } from "@/core/config/env";
import { useScope } from "@/core/auth/useScope";
import { partnerSupportService } from "@/features/partner/api/support.service";
import { partnerSupportKeys } from "@/features/partner/api/support.queries";
import { useChatIncomingSound } from "../hooks/useChatIncomingSound";

const CHAT_LIST_PARAMS = { per_page: 50 } as const;

function PartnerChatSoundListenerInner() {
  const pathname = usePathname();
  const { ownerId } = useScope();
  const activeChatId =
    pathname.match(/\/partner\/support\/chat\/([^/]+)/)?.[1] ?? null;

  useChatIncomingSound({
    listQueryKey: partnerSupportKeys.chats(CHAT_LIST_PARAMS),
    listQueryFn: () =>
      ownerId
        ? partnerSupportService.listChats(ownerId, CHAT_LIST_PARAMS)
        : Promise.resolve({ data: [], meta: { total: 0, page: 1, per_page: 50, last_page: 1 } }),
    detailQueryKey: (id) => partnerSupportKeys.chat(id),
    detailQueryFn: (id) =>
      ownerId
        ? partnerSupportService.getChat(ownerId, id)
        : Promise.resolve(null as never),
    activeChatId,
    isIncomingMessage: (role) => role === "agent",
  });

  return null;
}

export function PartnerChatSoundListener() {
  if (!env.useMocks) return null;
  return <PartnerChatSoundListenerInner />;
}
