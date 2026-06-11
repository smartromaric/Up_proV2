"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { useVehiclePerformance, useDriverPerformance } from "../api/performance.queries";
import { formatFCFA } from "@/shared/lib/format";
import type { VehiclePerformance, DriverPerformance } from "../api/performance.service";

export function PartnerPerformancePage() {
  const [tab, setTab] = useState<"vehicles" | "drivers">("vehicles");
  const vehiclesQuery = useVehiclePerformance();
  const driversQuery = useDriverPerformance();

  const isLoading = tab === "vehicles" ? vehiclesQuery.isLoading : driversQuery.isLoading;
  const isError = tab === "vehicles" ? vehiclesQuery.isError : driversQuery.isError;
  const data = tab === "vehicles" ? vehiclesQuery.data : driversQuery.data;
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Performance"
        breadcrumb={["Partenaire", "Analytics"]}
      />

      <div className="mt-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("vehicles")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "vehicles"
              ? "border-b-2 border-teal text-teal"
              : "text-muted hover:text-foreground"
          }`}
        >
          Véhicules
        </button>
        <button
          onClick={() => setTab("drivers")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "drivers"
              ? "border-b-2 border-teal text-teal"
              : "text-muted hover:text-foreground"
          }`}
        >
          Chauffeurs
        </button>
      </div>

      {isLoading && <div className="py-8">Chargement...</div>}
      {isError && <div className="py-8 text-red-600">Erreur de chargement</div>}

      {!isLoading && !isError && tab === "vehicles" && (
        <VehiclePerformanceTable rows={rows as VehiclePerformance[]} meta={meta} />
      )}
      {!isLoading && !isError && tab === "drivers" && (
        <DriverPerformanceTable rows={rows as DriverPerformance[]} meta={meta} />
      )}
    </div>
  );
}

function VehiclePerformanceTable({
  rows,
  meta,
}: {
  rows: VehiclePerformance[];
  meta: any;
}) {
  const columns: Column<VehiclePerformance>[] = [
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (v) => (
        <div className="font-medium">
          {v.brand} {v.model}
          {v.plate && <span className="text-muted ml-2">({v.plate})</span>}
        </div>
      ),
    },
    {
      id: "km",
      header: "Km parcourus",
      cell: (v) => `${v.total_km?.toLocaleString() ?? 0} km`,
    },
    {
      id: "trips",
      header: "Courses",
      cell: (v) => v.trips_count ?? 0,
    },
    {
      id: "revenue",
      header: "Revenus",
      cell: (v) => formatFCFA(v.revenue_fcfa ?? 0),
    },
    {
      id: "acceptance",
      header: "Tx d'acceptation",
      cell: (v) => `${v.acceptance_rate_pct ?? 0}%`,
    },
    {
      id: "rating",
      header: "Note moy.",
      cell: (v) => v.avg_rating?.toFixed(1) ?? "—",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(v) => v.id}
      emptyTitle="Aucune donnée de performance"
      pagination={false}
    />
  );
}

function DriverPerformanceTable({
  rows,
  meta,
}: {
  rows: DriverPerformance[];
  meta: any;
}) {
  const columns: Column<DriverPerformance>[] = [
    {
      id: "driver",
      header: "Chauffeur",
      cell: (d) => (
        <div className="font-medium">
          {d.first_name} {d.last_name}
        </div>
      ),
    },
    {
      id: "completed",
      header: "Courses complétées",
      cell: (d) => d.trips_completed ?? 0,
    },
    {
      id: "cancelled",
      header: "Annulations",
      cell: (d) => d.trips_cancelled ?? 0,
    },
    {
      id: "revenue",
      header: "Revenus",
      cell: (d) => formatFCFA(d.revenue_fcfa ?? 0),
    },
    {
      id: "rating",
      header: "Note moy.",
      cell: (d) => d.avg_rating?.toFixed(1) ?? "—",
    },
    {
      id: "acceptance",
      header: "Tx d'acceptation",
      cell: (d) => `${d.acceptance_rate_pct ?? 0}%`,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(d) => d.id}
      emptyTitle="Aucune donnée de performance"
      pagination={false}
    />
  );
}
