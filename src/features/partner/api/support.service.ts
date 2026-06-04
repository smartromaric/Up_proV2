import { apiClient } from "@/core/http/apiClient";
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
  listChats: (params?: ListParams) =>
    apiClient.get<Paginated<PartnerSupportChat>>(
      `/partner/support/chat${buildListQuery(params)}`
    ),

  getChat: (id: string) =>
    apiClient.get<PartnerSupportChatDetail>(`/partner/support/chat/${id}`),

  replyChat: (id: string, body: string) =>
    apiClient.post<PartnerSupportMessage>(`/partner/support/chat/${id}/messages`, {
      body,
    }),
};
