import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface PartnerSupportMessage {
  id: string;
  author: string;
  role: "reporter" | "agent" | "system";
  body: string;
  at: string;
}

export interface PartnerSupportChat {
  id: string;
  subject?: string;
  last_message_preview: string;
  unread_count: number;
  status: "open" | "closed";
  updated_at: string;
}

export interface PartnerSupportChatDetail extends PartnerSupportChat {
  messages: PartnerSupportMessage[];
}

export const partnerSupportService = {
  listChats: (partnerId: string | number, params?: ListParams) =>
    apiClient.get<Paginated<PartnerSupportChat>>(
      `${LINKS.partner.support.chat.list(partnerId)}${buildListQuery(params)}`
    ),

  getChat: (partnerId: string | number, chatId: string) =>
    apiClient.get<PartnerSupportChatDetail>(
      LINKS.partner.support.chat.getById(partnerId, chatId)
    ),

  replyChat: (partnerId: string | number, chatId: string, body: string) =>
    apiClient.post<PartnerSupportMessage>(
      LINKS.partner.support.chat.reply(partnerId, chatId),
      { body }
    ),
};
