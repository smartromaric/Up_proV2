import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import { paginateClientList } from "@/shared/lib/clientList";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import type {
  ApiChatConversationItem,
  ApiChatConversationsResponse,
  ApiChatMessageItem,
  ApiChatMessagesResponse,
} from "./adminChat.api.types";
import type {
  AdminSupportChat,
  AdminSupportChatDetail,
  AdminSupportMessage,
} from "./adminChat.types";

function pickString(...values: (string | null | undefined)[]): string {
  for (const v of values) {
    const t = v?.trim();
    if (t) return t;
  }
  return "";
}

function normalizeStatus(value?: string | null): AdminSupportChat["status"] {
  return String(value ?? "").toLowerCase() === "closed" ? "closed" : "open";
}

function normalizeMessageRole(value?: string | null): AdminSupportMessage["role"] {
  const role = String(value ?? "").toLowerCase();
  if (role === "agent" || role === "admin" || role === "staff") return "agent";
  if (role === "system") return "system";
  return "reporter";
}

function isFranchiseConversation(item: ApiChatConversationItem): boolean {
  const type = String(
    item.participant_type ?? item.participantType ?? ""
  ).toLowerCase();
  if (type === "franchise") return true;
  if (item.franchise_id ?? item.franchiseId) return true;
  if (type && type !== "franchise") return false;
  return Boolean(item.franchise_name ?? item.franchiseName);
}

export function mapApiConversationToAdminChat(
  item: ApiChatConversationItem
): AdminSupportChat {
  const franchiseName = pickString(item.franchise_name, item.franchiseName);
  const participantName = pickString(
    item.participant_name,
    item.participantName,
    franchiseName,
    "Franchise"
  );
  const city = pickString(item.franchise_city, item.franchiseCity, item.city);

  return {
    id: item.id,
    participant_name: participantName,
    franchise_id: item.franchise_id ?? item.franchiseId ?? null,
    franchise_city: city || null,
    subject: pickString(item.subject) || undefined,
    last_message_preview: pickString(
      item.last_message_preview,
      item.lastMessagePreview,
      item.last_message,
      item.lastMessage,
      "—"
    ),
    unread_count: item.unread_count ?? item.unreadCount ?? 0,
    status: normalizeStatus(item.status),
    updated_at:
      pickString(item.updated_at, item.updatedAt) || new Date().toISOString(),
  };
}

export function mapApiMessageToAdminMessage(
  item: ApiChatMessageItem
): AdminSupportMessage {
  return {
    id: item.id,
    author: pickString(
      item.author,
      item.author_name,
      item.authorName,
      item.sender_name,
      item.senderName,
      "—"
    ),
    role: normalizeMessageRole(item.role ?? item.sender_role ?? item.senderRole),
    body: pickString(item.body, item.content, item.text),
    at:
      pickString(item.at, item.created_at, item.createdAt) ||
      new Date().toISOString(),
  };
}

export function extractConversations(
  response: ApiChatConversationsResponse
): ApiChatConversationItem[] {
  return response.items ?? response.conversations ?? response.data ?? [];
}

export function extractMessages(
  response: ApiChatMessagesResponse
): ApiChatMessageItem[] {
  return response.items ?? response.messages ?? response.data ?? [];
}

export function mapConversationsToPaginated(
  response: ApiChatConversationsResponse,
  params?: ListParams
): Paginated<AdminSupportChat> {
  const franchiseOnly = extractConversations(response).filter(isFranchiseConversation);
  const rows = franchiseOnly.map(mapApiConversationToAdminChat);

  if (response.pagination) {
    return {
      data: rows,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }

  return paginateClientList(rows, params);
}

export function mapChatDetail(
  chat: AdminSupportChat,
  messages: ApiChatMessageItem[]
): AdminSupportChatDetail {
  return {
    ...chat,
    messages: messages.map(mapApiMessageToAdminMessage),
  };
}
