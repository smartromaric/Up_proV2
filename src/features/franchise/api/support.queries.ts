"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/core/http/notificationService";
import { franchiseSupportService } from "./support.service";
import type { ListParams } from "@/shared/types/listParams";

export const franchiseSupportKeys = {
  all: ["franchise", "support"] as const,
  tickets: (filters?: ListParams) =>
    [...franchiseSupportKeys.all, "tickets", filters] as const,
  ticket: (id: string) => [...franchiseSupportKeys.all, "ticket", id] as const,
  chats: (filters?: ListParams) =>
    [...franchiseSupportKeys.all, "chats", filters] as const,
  chat: (id: string) => [...franchiseSupportKeys.all, "chat", id] as const,
};

export function useFranchiseSupportTickets(params?: ListParams) {
  return useQuery({
    queryKey: franchiseSupportKeys.tickets(params),
    queryFn: () => franchiseSupportService.listTickets(params),
  });
}

export function useFranchiseSupportTicket(id: string) {
  return useQuery({
    queryKey: franchiseSupportKeys.ticket(id),
    queryFn: () => franchiseSupportService.getTicket(id),
    enabled: Boolean(id),
  });
}

export function useReplyFranchiseTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => franchiseSupportService.replyTicket(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchiseSupportKeys.ticket(id) });
      void qc.invalidateQueries({ queryKey: franchiseSupportKeys.all });
      notificationService.success("Réponse envoyée");
    },
    onError: () => notificationService.error("Envoi impossible"),
  });
}

export function useFranchiseSupportChats(params?: ListParams) {
  return useQuery({
    queryKey: franchiseSupportKeys.chats(params),
    queryFn: () => franchiseSupportService.listChats(params),
  });
}

export function useFranchiseSupportChat(id: string) {
  return useQuery({
    queryKey: franchiseSupportKeys.chat(id),
    queryFn: () => franchiseSupportService.getChat(id),
    enabled: Boolean(id),
  });
}

export function useReplyFranchiseChat(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => franchiseSupportService.replyChat(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: franchiseSupportKeys.chat(id) });
      void qc.invalidateQueries({ queryKey: franchiseSupportKeys.all });
      notificationService.success("Message envoyé");
    },
    onError: () => notificationService.error("Envoi impossible"),
  });
}
