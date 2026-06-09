import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { AdminSupportTicket } from "./tickets.service";

export interface ApiSupportTicketItem {
  id: string;
  subject?: string;
  category?: string;
  priority?: string;
  status?: string;
  reporter_name?: string;
  reporterName?: string;
  franchise_name?: string;
  franchiseName?: string;
  dispute_id?: string;
  disputeId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ApiSupportTicketsListResponse {
  status?: string;
  items?: ApiSupportTicketItem[];
  pagination?: ApiV1Pagination;
}

function mapTicketPriority(value?: string | null): AdminSupportTicket["priority"] {
  const key = String(value ?? "normal").toLowerCase();
  if (key === "high" || key === "urgent") return "high";
  if (key === "low") return "low";
  return "normal";
}

function mapTicketStatus(value?: string | null): AdminSupportTicket["status"] {
  const key = String(value ?? "open").toLowerCase();
  if (key === "resolved" || key === "closed") return "resolved";
  if (key === "in_progress" || key === "processing") return "in_progress";
  return "open";
}

export function mapSupportTicketItem(item: ApiSupportTicketItem): AdminSupportTicket {
  return {
    id: item.id,
    subject: item.subject ?? "—",
    category: item.category ?? "general",
    priority: mapTicketPriority(item.priority),
    status: mapTicketStatus(item.status),
    reporter_name: item.reporter_name ?? item.reporterName ?? "—",
    franchise_name: item.franchise_name ?? item.franchiseName ?? "—",
    dispute_id: item.dispute_id ?? item.disputeId,
    created_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    updated_at: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
  };
}

export function mapSupportTicketsListResponse(
  response: ApiSupportTicketsListResponse,
  params?: ListParams
): Paginated<AdminSupportTicket> {
  const mapped = (response.items ?? []).map(mapSupportTicketItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}
