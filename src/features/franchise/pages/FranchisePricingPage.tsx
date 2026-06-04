"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { FilterChips } from "@/shared/ui/FilterChips";
import { ServicePill } from "@/shared/ui/ServicePill";
import { formatFCFA } from "@/shared/lib/format";
import { getServiceLabel } from "@/shared/lib/tripLabels";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { PricingRule, TripService } from "@/shared/types";
import { useFranchisePricing } from "../api/pricing.queries";

const STATUS_FILTERS = [
  { value: "all" as const, label: "Toutes" },
  { value: "active" as const, label: "Actives" },
  { value: "draft" as const, label: "Brouillons" },
];

export function FranchisePricingPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | PricingRule["status"]>("all");

  const table = useServerTableState([statusFilter], {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: statusFilter, defaultValue: "all", reset: () => setStatusFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useFranchisePricing(table.listParams);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const summary = data?.summary;

  const columns: Column<PricingRule>[] = [
    {
      id: "zone",
      header: "Zone",
      cell: (p) => <span className="font-medium text-foreground">{p.zone_name}</span>,
      exportValue: (p) => p.zone_name,
    },
    {
      id: "service",
      header: "Service",
      cell: (p) => <ServicePill service={p.service as TripService} />,
      exportValue: (p) => getServiceLabel(p.service),
    },
    {
      id: "base",
      header: "Prise en charge",
      className: "tabular-nums",
      cell: (p) => formatFCFA(p.base_fare_fcfa),
      exportValue: (p) => p.base_fare_fcfa,
    },
    {
      id: "km",
      header: "Par km",
      className: "tabular-nums",
      cell: (p) => formatFCFA(p.per_km_fcfa),
      exportValue: (p) => p.per_km_fcfa,
    },
    {
      id: "min",
      header: "Minimum",
      className: "tabular-nums",
      cell: (p) => formatFCFA(p.min_fare_fcfa),
      exportValue: (p) => p.min_fare_fcfa,
    },
    {
      id: "surge",
      header: "Surge",
      className: "tabular-nums",
      cell: (p) =>
        p.surge_multiplier > 1 ? (
          <span className="font-medium text-amber-700">×{p.surge_multiplier}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
      exportValue: (p) => p.surge_multiplier,
    },
    {
      id: "status",
      header: "Statut",
      cell: (p) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            p.status === "active"
              ? "bg-teal/15 text-teal-dark"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {p.status === "active" ? "En vigueur" : "Brouillon"}
        </span>
      ),
      exportValue: (p) => (p.status === "active" ? "En vigueur" : "Brouillon"),
    },
    {
      id: "actions",
      header: "",
      cell: (p) => (
        <Link
          href={`/franchise/pricing/${p.id}`}
          className="text-xs font-medium text-teal hover:underline"
        >
          Modifier
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger la tarification.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tarification"
        breadcrumb={["Franchise", "Tarification"]}
        actions={
          <Link href="/franchise/pricing/new">
            <Button>Nouvelle grille</Button>
          </Link>
        }
      />

      <p className="mb-6 text-sm text-muted">
        Grilles tarifaires de votre territoire ({summary?.franchise_name ?? "—"}).
      </p>

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Grilles actives" value={String(summary.active_count)} />
          <KpiCard label="Brouillons" value={String(summary.draft_count)} />
          <KpiCard
            label="Territoire"
            value={summary.franchise_name}
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Zone, service…"
        totalLabel={meta ? `${meta.total} grilles` : undefined}
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
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFileName="tarification-franchise"
        emptyTitle="Aucune grille tarifaire"
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
