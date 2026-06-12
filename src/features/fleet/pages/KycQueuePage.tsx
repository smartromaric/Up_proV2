"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { Button } from "@/shared/ui/Button";
import { DateRangeFilter } from "@/shared/ui/DateRangeFilter";
import { FilterField } from "@/shared/ui/FilterField";
import { SearchInput } from "@/shared/ui/SearchInput";
import {
  TableFiltersPanel,
  TableFiltersSection,
} from "@/shared/ui/TableFiltersPanel";
import { formatDateTime } from "@/shared/lib/format";
import { useDateRangeFilter } from "@/shared/hooks/useDateRangeFilter";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { KycQueueItem } from "@/shared/types";
import { useKycQueue } from "../api/kyc.queries";

function WaitingBadge({ hours }: { hours: number }) {
  const urgent = hours >= 12;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        urgent ? "bg-amber-50 text-amber-700" : "bg-canvas text-muted"
      }`}
    >
      {hours}h d&apos;attente
    </span>
  );
}

export function KycQueuePage() {
  const dateRange = useDateRangeFilter({ defaultPreset: "all" });

  const table = useServerTableState(
    [dateRange.dateFrom, dateRange.dateTo],
    { ...dateRange.listParams }
  );

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [dateRange.resetField],
  });

  const { data, isLoading, isError } = useKycQueue(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<KycQueueItem>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (row) => (
        <div>
          <Link
            href={`/admin/fleet/drivers/${row.driver_id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {row.first_name} {row.last_name}
          </Link>
          <p className="text-xs text-muted">{row.phone}</p>
        </div>
      ),
      exportValue: (row) => `${row.first_name} ${row.last_name} (${row.phone})`,
    },
    {
      id: "zone",
      header: "Zone",
      cell: (row) => row.zone,
      exportValue: (row) => row.zone,
    },
    {
      id: "owner",
      header: "Partenaire",
      cell: (row) => row.owner_name,
      exportValue: (row) => row.owner_name,
    },
    {
      id: "docs",
      header: "Documents",
      cell: (row) => (
        <span className="text-sm">
          <span className="font-medium text-amber-700">{row.documents_pending}</span>
          <span className="text-muted"> en attente</span>
          {row.documents_rejected > 0 && (
            <span className="text-red-600"> · {row.documents_rejected} rejeté(s)</span>
          )}
        </span>
      ),
      exportValue: (row) => {
        const parts = [`${row.documents_pending} en attente`];
        if (row.documents_rejected > 0) {
          parts.push(`${row.documents_rejected} rejeté(s)`);
        }
        return parts.join(" · ");
      },
    },
    {
      id: "submitted",
      header: "Soumis le",
      cell: (row) => (
        <span className="whitespace-nowrap text-muted">
          {formatDateTime(row.submitted_at)}
        </span>
      ),
      exportValue: (row) => formatDateTime(row.submitted_at),
    },
    {
      id: "wait",
      header: "Priorité",
      cell: (row) => <WaitingBadge hours={row.waiting_hours} />,
      exportValue: (row) => `${row.waiting_hours}h d'attente`,
    },
    {
      id: "action",
      header: "",
      exportValue: () => "",
      cell: (row) => (
        <Link href={`/admin/fleet/drivers/${row.driver_id}`}>
          <Button variant="primary" className="!py-1.5 !text-xs">
            Examiner
          </Button>
        </Link>
      ),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger la file KYC.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="File KYC"
        breadcrumb={["Admin", "Flotte"]}
        actions={
          meta ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
              {meta.total} dossier{meta.total > 1 ? "s" : ""} en attente
            </span>
          ) : undefined
        }
      />

      <TableFiltersPanel>
        <TableFiltersSection title="Période (date de soumission)">
          <DateRangeFilter
            hideLabel
            showAllPreset
            preset={dateRange.preset}
            onPresetChange={dateRange.setPreset}
            customFrom={dateRange.customFrom}
            customTo={dateRange.customTo}
            onCustomFromChange={dateRange.setCustomFrom}
            onCustomToChange={dateRange.setCustomTo}
            rangeLabel={dateRange.rangeLabel}
            className="w-full"
          />
        </TableFiltersSection>

        <TableFiltersSection
          actions={
            hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                className="!h-auto !px-0 !py-0 !text-xs text-teal hover:text-teal-dark"
                onClick={resetAll}
              >
                Réinitialiser
              </Button>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <FilterField label="Recherche" className="min-w-0 flex-1 sm:min-w-[280px]">
              <SearchInput
                value={table.search}
                onChange={table.setSearch}
                placeholder="Nom, téléphone, zone, partenaire…"
                className="max-w-none"
              />
            </FilterField>
            {meta && (
              <p className="flex min-h-[42px] items-center text-sm text-muted tabular-nums">
                {meta.total} dossier{meta.total > 1 ? "s" : ""} en attente
              </p>
            )}
          </div>
        </TableFiltersSection>
      </TableFiltersPanel>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.driver_id}
        isLoading={isLoading}
        exportFileName="file-kyc"
        emptyTitle="File vide"
        emptyDescription="Aucun dossier KYC en attente de validation."
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
