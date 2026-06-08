"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { FilterChips } from "@/shared/ui/FilterChips";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Trip, TripStatus } from "@/shared/types";
import { useFranchiseOrdersList } from "../api/franchiseOrders.queries";

const ORDER_STATUS_FILTERS: { value: TripStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminées" },
  { value: "assigned", label: "Assignées" },
  { value: "cancelled", label: "Annulées" },
];

interface FranchiseDetailOrdersTabProps {
  franchiseId: string;
}

export function FranchiseDetailOrdersTab({
  franchiseId,
}: FranchiseDetailOrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const table = useServerTableState(
    [statusFilter, dateFrom, dateTo],
    {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }
  );

  const dateFilterActive = Boolean(dateFrom || dateTo);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      {
        value: dateFilterActive,
        defaultValue: false,
        reset: () => {
          setDateFrom("");
          setDateTo("");
        },
      },
    ],
  });

  const { data, isLoading, isError } = useFranchiseOrdersList(
    franchiseId,
    statusFilter,
    table.listParams
  );

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Trip>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (t) => (
        <Link
          href={`/admin/ops/trips/${t.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {t.ref}
        </Link>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "created_at",
      header: "Date",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => t.created_at,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums",
      cell: (t) => formatFCFA(t.amount_fcfa),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => (
        <StatusPill status={t.status} pulse={t.status === "in_progress"} />
      ),
      exportValue: (t) => getTripStatusLabel(t.status),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les courses de cette franchise.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, adresse…"
        totalLabel={
          meta ? `${meta.total.toLocaleString("fr-CI")} courses` : undefined
        }
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={ORDER_STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="whitespace-nowrap">Du</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="whitespace-nowrap">Au</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
          />
        </label>
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="courses-franchise-detail"
        emptyTitle="Aucune course"
        emptyDescription="Aucun résultat pour ces filtres."
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
