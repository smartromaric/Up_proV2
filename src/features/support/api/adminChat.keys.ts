import type { ListParams } from "@/shared/types/listParams";

export const adminChatKeys = {
  all: ["admin", "support", "chat"] as const,
  list: (params?: ListParams) => [...adminChatKeys.all, "list", params] as const,
  detail: (id: string) => [...adminChatKeys.all, "detail", id] as const,
};
