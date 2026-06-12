import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiChatConversationsResponse,
  ApiChatMessagesResponse,
} from "./adminChat.api.types";
import {
  extractConversations,
  extractMessages,
  mapApiConversationToAdminChat,
  mapChatDetail,
  mapConversationsToPaginated,
} from "./adminChat.mapper";
import type {
  AdminSupportChat,
  AdminSupportChatDetail,
  AdminSupportMessage,
} from "./adminChat.types";

const LEGACY_LIST = "/admin/support/chat";

function findChatInList(
  chats: AdminSupportChat[],
  chatId: string
): AdminSupportChat | undefined {
  return chats.find((c) => String(c.id) === String(chatId));
}

export const adminChatService = {
  listChats: async (params?: ListParams): Promise<Paginated<AdminSupportChat>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<AdminSupportChat>>(
        `${LEGACY_LIST}${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiChatConversationsResponse>(
      `${LINKS.admin.v1.chatConversations}${buildV1ListQuery({
        ...params,
        type: params?.type ?? "franchise",
      })}`
    );

    return mapConversationsToPaginated(response, params);
  },

  getChat: async (chatId: string): Promise<AdminSupportChatDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<AdminSupportChatDetail>(`${LEGACY_LIST}/${chatId}`);
    }

    const [listResponse, messagesResponse] = await Promise.all([
      apiClient.get<ApiChatConversationsResponse>(
        `${LINKS.admin.v1.chatConversations}${buildV1ListQuery({
          type: "franchise",
          per_page: 100,
        })}`
      ),
      apiClient.get<ApiChatMessagesResponse>(
        LINKS.admin.v1.chatMessages(chatId)
      ),
    ]);

    const conversations = extractConversations(listResponse).map(
      mapApiConversationToAdminChat
    );
    const chat =
      findChatInList(conversations, chatId) ??
      mapApiConversationToAdminChat({
        id: chatId,
        participant_name: "Franchise",
      });

    return mapChatDetail(chat, extractMessages(messagesResponse));
  },

  replyChat: (chatId: string, body: string) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<AdminSupportMessage>(`${LEGACY_LIST}/${chatId}/messages`, {
        body,
      });
    }

    return apiClient.post<AdminSupportMessage>(
      LINKS.admin.v1.chatMessages(chatId),
      { body, content: body, text: body }
    );
  },
};
