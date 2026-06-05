import { apiClient } from "@/core/http/apiClient";
import { AppError } from "@/core/http/errorHandler";
import { LINKS } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

function chatApiUnavailable(): never {
  throw new AppError(
    "Le chat support franchise n'est pas disponible via l'API v1.",
    "FRANCHISE_SUPPORT_CHAT_UNAVAILABLE",
    501
  );
}

export type SupportReporterType = "partner" | "driver" | "client";

export interface FranchiseSupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  reporter_type: SupportReporterType;
  reporter_name: string;
  created_at: string;
  updated_at: string;
}

export interface FranchiseSupportMessage {
  id: string;
  author: string;
  role: "reporter" | "agent" | "system";
  body: string;
  at: string;
}

export interface FranchiseSupportTicketDetail extends FranchiseSupportTicket {
  messages: FranchiseSupportMessage[];
}

export interface FranchiseSupportChat {
  id: string;
  participant_name: string;
  participant_type: SupportReporterType;
  subject?: string;
  last_message_preview: string;
  unread_count: number;
  status: "open" | "closed";
  updated_at: string;
}

export interface FranchiseSupportChatDetail extends FranchiseSupportChat {
  messages: FranchiseSupportMessage[];
}

function emptyChatsPage(params?: ListParams): Paginated<FranchiseSupportChat> {
  const per_page = params?.per_page ?? 50;
  const page = params?.page ?? 1;
  return {
    data: [],
    meta: {
      total: 0,
      per_page,
      current_page: page,
      last_page: 1,
    },
  };
}

export const franchiseSupportService = {
  listTickets: (params?: ListParams) =>
    apiClient.get<Paginated<FranchiseSupportTicket>>(
      `/franchise/support/tickets${buildListQuery(params)}`
    ),

  getTicket: (id: string) =>
    apiClient.get<FranchiseSupportTicketDetail>(`/franchise/support/tickets/${id}`),

  replyTicket: (id: string, body: string) =>
    apiClient.post<FranchiseSupportMessage>(`/franchise/support/tickets/${id}/messages`, {
      body,
    }),

  listChats: (params?: ListParams) => {
    if (!useLegacyPortalApi()) {
      return Promise.resolve(emptyChatsPage(params));
    }
    return apiClient.get<Paginated<FranchiseSupportChat>>(
      `${LINKS.franchise.support.chat.list}${buildListQuery(params)}`
    );
  },

  getChat: (id: string) => {
    if (!useLegacyPortalApi()) return Promise.reject(chatApiUnavailable());
    return apiClient.get<FranchiseSupportChatDetail>(
      LINKS.franchise.support.chat.getById(id)
    );
  },

  replyChat: (id: string, body: string) => {
    if (!useLegacyPortalApi()) return Promise.reject(chatApiUnavailable());
    return apiClient.post<FranchiseSupportMessage>(
      LINKS.franchise.support.chat.reply(id),
      { body }
    );
  },
};
