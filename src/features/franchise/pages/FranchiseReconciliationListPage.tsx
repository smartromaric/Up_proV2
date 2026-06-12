"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { formatFCFA } from "@/shared/lib/format";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { FranchiseLiveMapPartnerFilter } from "../components/FranchiseLiveMapPartnerFilter";
import type { FranchiseLiveMapFiltersValue } from "../api/liveMap.types";
import type { FranchiseReconciliationRow } from "../api/reconciliation.service";
import { useFranchiseReconciliationList } from "../api/reconciliation.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Tous" },
  { value: "matched" as const, label: "Rapprochés" },
  { value: "discrepancy" as const, label: "Écarts" },
  { value: "pending" as const, label: "En cours" },
];

export function FranchiseReconciliationListPage() {
  const [statusFilter, setStatusFilter] =
    useState<FranchiseReconciliationRow["status"] | "all">("all");
  const [scope, setScope] = useState<FranchiseLiveMapFiltersValue>({
    partnerId: null,
  });

  const dateRange = useDateRangeFilter({ defaultPreset: "7d" });

  const table = useServerTableState(
    [statusFilter, scope.partnerId, dateRange.dateFrom, dateRange.dateTo],
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      partner_id: scope.partnerId ?? undefined,
      ...dateRange.listParams,
    }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
      {
        value: scope.partnerId != null,
        defaultValue: false,
        reset: () => setScope({ partnerId: null }),
      },
      dateRange.resetField,
    ],
  });

  const { data, isLoading, isError } = useFranchiseReconciliationList(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const showPartnerColumn = scope.partnerId == null;

  const columns: Column<FranchiseReconciliationRow>[] = [
    {
      id: "date",
      header: "Date",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.date_label}</p>
          <p className="text-xs text-muted">{r.id}</p>
        </div>
      ),
      exportValue: (r) => r.date_label,
    },
    ...(showPartnerColumn
      ? [
          {
            id: "partner",
            header: "Partenaire",
            cell: (r: FranchiseReconciliationRow) =>
              r.partner_id != null ? (
                <Link
                  href={`/franchise/partners/${r.partner_id}`}
                  className="text-sm text-foreground hover:text-teal"
                >
                  {r.partner_name}
                </Link>
              ) : (
                <span className="text-muted">Territoire</span>
              ),
            exportValue: (r: FranchiseReconciliationRow) => r.partner_name ?? "",
          } satisfies Column<FranchiseReconciliationRow>,
        ]
      : []),
    {
      id: "source",
      header: "Source",
      cell: (r) => r.source,
      exportValue: (r) => r.source,
    },
    {
      id: "expected",
      header: "Attendu",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.expected_fcfa),
      exportValue: (r) => r.expected_fcfa,
    },
    {
      id: "received",
      header: "Reçu",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.received_fcfa),
      exportValue: (r) => r.received_fcfa,
    },
    {
      id: "delta",
      header: "Écart",
      className: "tabular-nums",
      cell: (r) => (
        <span
          className={
            r.delta_fcfa === 0
              ? "text-muted"
              : r.delta_fcfa < 0
                ? "font-medium text-red-600"
                : "font-medium text-teal-dark"
          }
        >
          {r.delta_fcfa === 0 ? "—" : formatFCFA(r.delta_fcfa)}
        </span>
      ),
      exportValue: (r) => r.delta_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (r) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            r.status === "matched"
              ? "bg-teal/15 text-teal-dark"
              : r.status === "discrepancy"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {r.status === "matched"
            ? "Rapproché"
            : r.status === "discrepancy"
              ? "Écart détecté"
              : "En cours"}
        </span>
      ),
      exportValue: (r) => r.status,
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la réconciliation.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Réconciliation"
        breadcrumb={["Franchise", "Finance", "Réconciliation"]}
      />

      {data?.filter_options && (
        <FranchiseLiveMapPartnerFilter
          options={data.filter_options}
          value={scope}
          onChange={setScope}
        />
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Source, partenaire, référence…"
        totalLabel={meta ? `${meta.total} lignes` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <FilterChips
          options={STATUS_FILTERS}
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
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="reconciliation-franchise"
        emptyTitle="Aucune ligne de réconciliation"
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
