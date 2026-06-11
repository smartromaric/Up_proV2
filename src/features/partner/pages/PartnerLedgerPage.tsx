"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { usePartnerLedger } from "../api/wallet.queries";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { LedgerEntry } from "../api/wallet.service";

export function PartnerLedgerPage() {
  const table = useServerTableState([]);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerLedger(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<LedgerEntry>[] = [
    {
      id: "id",
      header: "ID",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      id: "label",
      header: "Description",
      cell: (row) => row.label || "—",
    },
    {
      id: "amount",
      header: "Montant",
      cell: (row) => (
        <span className={row.direction === "credit" ? "text-green-600" : "text-red-600"}>
          {row.direction === "credit" ? "+" : "-"}
          {formatFCFA(row.amount_fcfa)}
        </span>
      ),
    },
    {
      id: "balance_after",
      header: "Solde après",
      cell: (row) =>
        row.balance_after_fcfa != null ? formatFCFA(row.balance_after_fcfa) : "—",
    },
    {
      id: "created_at",
      header: "Date",
      cell: (row) => <span className="text-muted text-sm">{formatDateTime(row.created_at)}</span>,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger le grand livre.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Grand livre"
        breadcrumb={["Partenaire", "Finances"]}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Rechercher une transaction..."
        totalLabel={meta ? `${meta.total} transaction${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyTitle="Aucune transaction"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}
