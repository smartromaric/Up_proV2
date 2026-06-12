"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { StatusPill } from "@/shared/ui/StatusPill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel, STATUS_FILTER_OPTIONS } from "@/shared/lib/tripLabels";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import type { TripStatus } from "@/shared/types";
import type { PartnerBooking } from "../api/bookings.service";
import { usePartnerOrdersList } from "../api/orders.queries";

export function PartnerOrdersListPage() {
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");

  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });
  const table = useServerTableState([statusFilter, dateRange.dateFrom, dateRange.dateTo], {
    status: statusFilter !== "all" ? statusFilter : undefined,
    ...dateRange.listParams,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = usePartnerOrdersList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<PartnerBooking>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (b) => (
        <Link
          href={`/partner/orders/${b.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {b.ref}
        </Link>
      ),
      exportValue: (b) => b.ref,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (b) => (
        <div className="min-w-[200px]">
          <p className="text-sm text-foreground">{b.from_label}</p>
          <p className="text-xs text-muted">→ {b.to_label}</p>
        </div>
      ),
      exportValue: (b) => `${b.from_label} → ${b.to_label}`,
    },
    {
      id: "client",
      header: "Client",
      cell: (b) => (
        <div>
          <p className="text-sm">{b.client_name}</p>
          {b.client_phone && <p className="text-xs text-muted">{b.client_phone}</p>}
        </div>
      ),
      exportValue: (b) => (b.client_phone ? `${b.client_name} (${b.client_phone})` : b.client_name),
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (b) => b.driver_name ?? "—",
      exportValue: (b) => b.driver_name ?? "",
    },
    {
      id: "payment_status",
      header: "Paiement",
      cell: (b) => b.payment_status ?? "—",
      exportValue: (b) => b.payment_status ?? "",
    },
    {
      id: "amount",
      header: "Montant",
      cell: (b) => (b.amount_fcfa != null ? formatFCFA(b.amount_fcfa) : "—"),
      exportValue: (b) => (b.amount_fcfa != null ? String(b.amount_fcfa) : ""),
    },
    {
      id: "status",
      header: "Statut",
      cell: (b) => <StatusPill status={b.status} pulse={b.status === "in_progress"} />,
      exportValue: (b) => getTripStatusLabel(b.status),
    },
    {
      id: "date",
      header: "Créée le",
      cell: (b) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDateTime(b.created_at)}
        </span>
      ),
      exportValue: (b) => formatDateTime(b.created_at),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les courses.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Courses"
        breadcrumb={["Partenaire", "Courses"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Réf., client, adresse, chauffeur…"
        totalLabel={meta ? `${meta.total} courses enregistrées` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <DateRangeFilter
          preset={dateRange.preset}
          onPresetChange={dateRange.setPreset}
          customFrom={dateRange.customFrom}
          customTo={dateRange.customTo}
          onCustomFromChange={dateRange.setCustomFrom}
          onCustomToChange={dateRange.setCustomTo}
          rangeLabel={dateRange.rangeLabel}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        exportFileName="courses-partenaire"
        emptyTitle="Aucune course"
        emptyDescription="Les courses de votre flotte apparaîtront ici."
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
