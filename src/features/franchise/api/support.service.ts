import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

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

  listChats: (params?: ListParams) =>
    apiClient.get<Paginated<FranchiseSupportChat>>(
      `/franchise/support/chat${buildListQuery(params)}`
    ),

  getChat: (id: string) =>
    apiClient.get<FranchiseSupportChatDetail>(`/franchise/support/chat/${id}`),

  replyChat: (id: string, body: string) =>
    apiClient.post<FranchiseSupportMessage>(`/franchise/support/chat/${id}/messages`, {
      body,
    }),
};
