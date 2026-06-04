"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatDateTime } from "@/shared/lib/format";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { PartnerSupportChat } from "../api/support.service";
import { usePartnerSupportChats } from "../api/support.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "open" as const, label: "Ouverts" },
  { value: "closed" as const, label: "Clôturés" },
];

export function PartnerSupportChatListPage() {
  const [statusFilter, setStatusFilter] = useState<PartnerSupportChat["status"] | "all">(
    "all"
  );

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = usePartnerSupportChats(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<PartnerSupportChat>[] = [
    {
      id: "subject",
      header: "Conversation",
      cell: (c) => (
        <Link href={`/partner/support/chat/${c.id}`} className="block hover:opacity-90">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {c.subject ?? "Support franchise"}
              </p>
              <p className="mt-1 truncate text-sm text-muted">{c.last_message_preview}</p>
            </div>
            {c.unread_count > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal px-1.5 text-[10px] font-bold text-white">
                {c.unread_count}
              </span>
            )}
          </div>
        </Link>
      ),
      exportValue: (c) => c.subject ?? c.id,
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === "open"
              ? "bg-teal/15 text-teal-dark"
              : "bg-canvas text-muted"
          }`}
        >
          {c.status === "open" ? "Ouvert" : "Clôturé"}
        </span>
      ),
      exportValue: (c) => c.status,
    },
    {
      id: "updated",
      header: "Dernière activité",
      cell: (c) => formatDateTime(c.updated_at),
      exportValue: (c) => c.updated_at,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les conversations.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Chat"
        breadcrumb={["Partenaire", "Support", "Chat"]}
      />

      <p className="mb-4 text-sm text-muted">
        Échangez avec le support de votre franchise (commissions, KYC, wallet, etc.).
      </p>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Sujet, message…"
        totalLabel={meta ? `${meta.total} conversations` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="chat-support-partenaire"
        emptyTitle="Aucune conversation"
        pagination={false}
        serverPagination={serverPaginationFromMeta(
          meta,
          table.setPage,
          table.setPageSize
        )}
      />
    </div>
  );
}
