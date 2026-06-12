import { http, HttpResponse } from "msw";
import adminSupportTickets from "../data/admin-support-tickets.json";
import adminSupportChatsSeed from "../data/admin-support-chats.json";
import adminDisputeDetail from "../data/admin-dispute-detail.json";
import type {
  AdminSupportChat,
  AdminSupportChatDetail,
  AdminSupportMessage,
} from "@/features/support/api/adminChat.types";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";

let disputeState = { ...adminDisputeDetail };

let adminSupportChatsState: { data: AdminSupportChat[] } = {
  data: adminSupportChatsSeed.data as AdminSupportChat[],
};

function buildAdminChatDetail(chat: AdminSupportChat): AdminSupportChatDetail {
  const samples: Record<string, AdminSupportMessage[]> = {
    "ADM-CH-001": [
      {
        id: "ADM-CH-001-m1",
        author: "UPJUNOO Côte d'Ivoire",
        role: "reporter",
        body: "Bonjour, nous avons un écart sur les commissions Treichville en juin.",
        at: "2026-06-12T09:00:00Z",
      },
      {
        id: "ADM-CH-001-m2",
        author: "Admin UpJunoo",
        role: "agent",
        body: "Bonjour, je regarde le rapport consolidé et je reviens vers vous.",
        at: "2026-06-12T09:45:00Z",
      },
      {
        id: "ADM-CH-001-m3",
        author: "UPJUNOO Côte d'Ivoire",
        role: "reporter",
        body: "Pouvez-vous confirmer le taux appliqué sur Treichville ?",
        at: "2026-06-12T10:30:00Z",
      },
    ],
  };

  return {
    ...chat,
    messages: samples[chat.id] ?? [
      {
        id: `${chat.id}-start`,
        author: chat.participant_name,
        role: "reporter",
        body: chat.last_message_preview,
        at: chat.updated_at,
      },
    ],
  };
}

const adminChatDetails: Record<string, AdminSupportChatDetail> = Object.fromEntries(
  adminSupportChatsState.data.map((chat) => [chat.id, buildAdminChatDetail(chat)])
);

export const supportHandlers = [
  http.get("*/api/v2/admin/support/tickets", ({ request }) => {
    const query = parseListQuery(request);
    const list = adminSupportTickets.data.filter((t) =>
      matchesSearch(
        query.search,
        t.id,
        t.subject,
        t.reporter_name,
        t.franchise_name,
        t.category
      )
    );
    if (query.status) {
      return HttpResponse.json(
        paginatedList(
          list.filter((t) => t.status === query.status),
          query
        )
      );
    }
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/admin/support/disputes/:id", ({ params }) => {
    const id = String(params.id);
    if (id !== disputeState.id && id !== "DSP-501") {
      return HttpResponse.json({ message: "Litige introuvable" }, { status: 404 });
    }
    return HttpResponse.json({ ...disputeState, id: id || disputeState.id });
  }),

  http.post("*/api/v2/admin/support/disputes/:id/resolve", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as {
      note?: string;
      outcome?: string;
      refund_fcfa?: number;
    };
    const note = body.note?.trim() || "Litige clôturé";
    const outcomeLabel =
      body.outcome === "full_refund"
        ? "Remboursement intégral"
        : body.outcome === "partial_refund"
          ? `Remboursement partiel${body.refund_fcfa ? ` (${body.refund_fcfa} FCFA)` : ""}`
          : body.outcome === "rejected"
            ? "Réclamation rejetée"
            : "Résolution standard";

    disputeState = {
      ...disputeState,
      id,
      status: "resolved",
      updated_at: new Date().toISOString(),
      timeline: [
        ...disputeState.timeline,
        {
          id: "resolved-now",
          label: outcomeLabel,
          description: note,
          at: new Date().toISOString(),
          actor: "admin@upjunoo.ci",
        },
      ],
    };
    return HttpResponse.json({
      ok: true,
      message: "Litige marqué comme résolu",
    });
  }),

  http.get("*/api/v2/admin/support/chat", ({ request }) => {
    const query = parseListQuery(request);
    let list = adminSupportChatsState.data;
    list = list.filter((c) =>
      matchesSearch(
        query.search,
        c.id,
        c.participant_name,
        c.franchise_city ?? "",
        c.last_message_preview,
        c.subject ?? ""
      )
    );
    if (query.status) list = list.filter((c) => c.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/api/v2/admin/support/chat/:id", ({ params }) => {
    const id = String(params.id);
    const detail = adminChatDetails[id];
    if (!detail) {
      return HttpResponse.json({ message: "Conversation introuvable" }, { status: 404 });
    }
    detail.unread_count = 0;
    const idx = adminSupportChatsState.data.findIndex((c) => c.id === id);
    if (idx >= 0) {
      adminSupportChatsState.data[idx] = {
        ...adminSupportChatsState.data[idx],
        unread_count: 0,
      };
    }
    return HttpResponse.json(detail);
  }),

  http.post(
    "*/api/v2/admin/support/chat/:id/messages",
    async ({ params, request }) => {
      const id = String(params.id);
      const detail = adminChatDetails[id];
      if (!detail) {
        return HttpResponse.json(
          { message: "Conversation introuvable" },
          { status: 404 }
        );
      }
      const body = (await request.json()) as { body?: string };
      const text = body.body?.trim();
      if (!text) {
        return HttpResponse.json({ message: "Message requis" }, { status: 422 });
      }
      const msg: AdminSupportMessage = {
        id: `ADM-CHM-${Date.now()}`,
        author: "Admin UpJunoo",
        role: "agent",
        body: text,
        at: new Date().toISOString(),
      };
      detail.messages = [...detail.messages, msg];
      detail.last_message_preview = text;
      detail.updated_at = msg.at;
      const idx = adminSupportChatsState.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        adminSupportChatsState.data[idx] = {
          ...adminSupportChatsState.data[idx],
          last_message_preview: text,
          updated_at: msg.at,
          unread_count: 0,
        };
      }
      return HttpResponse.json(msg, { status: 201 });
    }
  ),

  http.get("*/v1/chat/conversations", ({ request }) => {
    const query = parseListQuery(request);
    let list = adminSupportChatsState.data.map((c) => ({
      id: c.id,
      participantType: "franchise",
      participantName: c.participant_name,
      franchiseId: c.franchise_id,
      franchiseCity: c.franchise_city,
      subject: c.subject,
      lastMessagePreview: c.last_message_preview,
      unreadCount: c.unread_count,
      status: c.status,
      updatedAt: c.updated_at,
    }));
    list = list.filter((c) =>
      matchesSearch(
        query.search,
        c.id,
        c.participantName,
        c.franchiseCity ?? "",
        c.lastMessagePreview,
        c.subject ?? ""
      )
    );
    if (query.status) {
      list = list.filter((c) => c.status === query.status);
    }
    const page = paginatedList(list, query);
    return HttpResponse.json({
      status: "ok",
      items: page.data,
      pagination: {
        page: page.meta.current_page,
        limit: page.meta.per_page,
        total: page.meta.total,
        totalPages: page.meta.last_page,
        hasMore: page.meta.current_page < page.meta.last_page,
      },
    });
  }),

  http.get("*/v1/chat/conversations/:id/messages", ({ params }) => {
    const id = String(params.id);
    const detail = adminChatDetails[id];
    if (!detail) {
      return HttpResponse.json({ status: "ok", items: [] });
    }
    return HttpResponse.json({
      status: "ok",
      items: detail.messages.map((m) => ({
        id: m.id,
        body: m.body,
        authorName: m.author,
        role: m.role,
        createdAt: m.at,
      })),
    });
  }),

  http.post(
    "*/v1/chat/conversations/:id/messages",
    async ({ params, request }) => {
      const id = String(params.id);
      const detail = adminChatDetails[id];
      if (!detail) {
        return HttpResponse.json(
          { message: "Conversation introuvable" },
          { status: 404 }
        );
      }
      const body = (await request.json()) as { body?: string; content?: string };
      const text = (body.body ?? body.content)?.trim();
      if (!text) {
        return HttpResponse.json({ message: "Message requis" }, { status: 422 });
      }
      const msg: AdminSupportMessage = {
        id: `ADM-CHM-${Date.now()}`,
        author: "Admin UpJunoo",
        role: "agent",
        body: text,
        at: new Date().toISOString(),
      };
      detail.messages = [...detail.messages, msg];
      detail.last_message_preview = text;
      detail.updated_at = msg.at;
      return HttpResponse.json(
        {
          id: msg.id,
          body: msg.body,
          authorName: msg.author,
          role: msg.role,
          createdAt: msg.at,
        },
        { status: 201 }
      );
    }
  ),
];
