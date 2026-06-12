import type { ApiV1Pagination } from "@/core/api/v1Pagination";

export interface ApiChatConversationItem {
  id: string;
  subject?: string | null;
  status?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  participant_name?: string | null;
  participantName?: string | null;
  participant_type?: string | null;
  participantType?: string | null;
  franchise_id?: string | null;
  franchiseId?: string | null;
  franchise_name?: string | null;
  franchiseName?: string | null;
  franchise_city?: string | null;
  franchiseCity?: string | null;
  city?: string | null;
  last_message_preview?: string | null;
  lastMessagePreview?: string | null;
  last_message?: string | null;
  lastMessage?: string | null;
  unread_count?: number | null;
  unreadCount?: number | null;
}

export interface ApiChatMessageItem {
  id: string;
  body?: string | null;
  content?: string | null;
  text?: string | null;
  author?: string | null;
  author_name?: string | null;
  authorName?: string | null;
  sender_name?: string | null;
  senderName?: string | null;
  role?: string | null;
  sender_role?: string | null;
  senderRole?: string | null;
  at?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
}

export interface ApiChatConversationsResponse {
  status?: string;
  items?: ApiChatConversationItem[];
  conversations?: ApiChatConversationItem[];
  data?: ApiChatConversationItem[];
  pagination?: ApiV1Pagination;
}

export interface ApiChatMessagesResponse {
  status?: string;
  items?: ApiChatMessageItem[];
  messages?: ApiChatMessageItem[];
  data?: ApiChatMessageItem[];
}
