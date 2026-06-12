"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import { Button } from "@/shared/ui/Button";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Zone } from "@/shared/types";
import { useZonesList, useZonesMapOverview } from "../api/zones.queries";
import { AbidjanZonesMap } from "../components/AbidjanZonesMap";

const ZONE_TYPE_LABELS: Record<Zone["type"], string> = {
  standard: "Standard",
  surge: "Surge",
  airport: "Aéroport",
};

const TYPE_OPTIONS = [
  { value: "all" as const, label: "Tous les types" },
  { value: "standard" as const, label: "Standard" },
  { value: "surge" as const, label: "Surge" },
  { value: "airport" as const, label: "Aéroport" },
];

export function ZonesListPage() {
  const router = useRouter();
  const legacyApi = useLegacyAdminApi();
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("all");
  const [selectedMapZoneId, setSelectedMapZoneId] = useState<number | string | null>(
    null
  );

  const table = useServerTableState([typeFilter], {
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
    fields: [
      { value: typeFilter, defaultValue: "all", reset: () => setTypeFilter("all") },
    ],
  });

  const { data, isLoading, isError } = useZonesList(table.listParams);
  const { data: mapOverview, isLoading: mapLoading } = useZonesMapOverview();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Zone>[] = [
    {
      id: "name",
      header: "Zone",
      cell: (z) => (
        <div>
          <Link
            href={`/admin/network/zones/${z.id}`}
            className="font-medium text-foreground hover:text-teal"
          >
            {z.name}
          </Link>
          <p className="text-xs text-muted">{z.city}</p>
        </div>
      ),
      exportValue: (z) => `${z.name} (${z.city})`,
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (z) => z.franchise_name,
      exportValue: (z) => z.franchise_name,
    },
    {
      id: "type",
      header: "Type",
      cell: (z) => <ZoneTypePill type={z.type} />,
      exportValue: (z) => ZONE_TYPE_LABELS[z.type],
    },
    {
      id: "surge",
      header: "Multiplicateur",
      className: "tabular-nums",
      cell: (z) =>
        z.surge_multiplier && z.surge_multiplier > 1
          ? `×${z.surge_multiplier}`
          : "—",
      exportValue: (z) =>
        z.surge_multiplier && z.surge_multiplier > 1 ? z.surge_multiplier : "",
    },
    {
      id: "drivers",
      header: "Chauffeurs actifs",
      className: "tabular-nums",
      cell: (z) => z.drivers_active.toLocaleString("fr-CI"),
      exportValue: (z) => z.drivers_active,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les zones.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Zones"
        breadcrumb={["Admin", "Réseau"]}
        actions={
          legacyApi ? (
            <Button
              variant="primary"
              onClick={() => router.push("/admin/network/zones/new")}
            >
              Nouvelle zone
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6">
        {mapLoading ? (
          <div className="h-[min(380px,50vh)] animate-pulse rounded-card border border-border bg-surface" />
        ) : (
          <AbidjanZonesMap
            mode="select"
            zones={mapOverview?.zones ?? []}
            hotZones={mapOverview?.hotZones ?? []}
            cityLabel={mapOverview?.city ?? "Zones"}
            selectedZoneId={selectedMapZoneId}
            onSelectZone={(zone) => {
              setSelectedMapZoneId(zone.id);
              router.push(`/admin/network/zones/${zone.id}`);
            }}
          />
        )}
      </div>

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Zone, ville, franchise…"
        totalLabel={meta ? `${meta.total} zones` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={TYPE_OPTIONS}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(z) => z.id}
        isLoading={isLoading}
        exportFileName="zones"
        emptyTitle="Aucune zone"
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
