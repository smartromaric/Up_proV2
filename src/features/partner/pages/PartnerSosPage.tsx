"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import {
  usePartnerSosList,
  usePartnerSosDashboard,
  useAcknowledgeSos,
} from "../api/safety.queries";
import { formatDateTime } from "@/shared/lib/format";
import type { SosIncident } from "../api/safety.service";

export function PartnerSosPage() {
  const table = useServerTableState([]);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerSosList(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const dashboardQuery = usePartnerSosDashboard();
  const dashboard = dashboardQuery.data;

  const columns: Column<SosIncident>[] = [
    {
      id: "type",
      header: "Type",
      cell: (o) => <SosTypeBadge type={o.type} />,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (o) => (
        <div className="text-sm">
          <div className="font-medium">{o.driver_name || "—"}</div>
          {o.vehicle_plate && (
            <div className="text-muted text-xs">{o.vehicle_plate}</div>
          )}
        </div>
      ),
    },
    {
      id: "location",
      header: "Localisation",
      cell: (o) => (
        <div className="text-sm text-muted">
          {o.location?.address || `${o.location?.lat?.toFixed(4)}, ${o.location?.lng?.toFixed(4)}` || "—"}
        </div>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (o) => <SosStatusBadge status={o.status} />,
    },
    {
      id: "triggered",
      header: "Déclenché",
      cell: (o) => <span className="text-muted text-sm">{formatDateTime(o.triggered_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (o) => <SosActions incident={o} />,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les incidents SOS.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Sécurité / SOS"
        breadcrumb={["Partenaire", "Sécurité"]}
        actions={
          <Button
            variant="secondary"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            Actualiser
          </Button>
        }
      />

      {/* Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            label="Actifs"
            value={dashboard.active_count}
            color="red"
          />
          <DashboardCard
            label="Accusés"
            value={dashboard.acknowledged_count}
            color="blue"
          />
          <DashboardCard
            label="Aujourd'hui"
            value={dashboard.today_count}
            color="teal"
          />
          <DashboardCard
            label="Total"
            value={meta?.total || 0}
            color="gray"
          />
        </div>
      )}

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Chauffeur, plaque..."
        totalLabel={meta ? `${meta.total} incident${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyTitle="Aucun incident SOS"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}

function DashboardCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "red" | "blue" | "teal" | "gray";
}) {
  const colors = {
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
    teal: "bg-teal-50 border-teal-200",
    gray: "bg-gray-50 border-gray-200",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function SosTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    panic_button: "bg-red-100 text-red-700",
    crash_detected: "bg-orange-100 text-orange-700",
    manual_report: "bg-yellow-100 text-yellow-700",
    deviation: "bg-purple-100 text-purple-700",
  };
  const labels: Record<string, string> = {
    panic_button: "Bouton panique",
    crash_detected: "Accident",
    manual_report: "Signalement",
    deviation: "Déviation",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[type] ?? styles.manual_report}`}>
      {labels[type] ?? type}
    </span>
  );
}

function SosStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-red-100 text-red-700 animate-pulse",
    acknowledged: "bg-blue-100 text-blue-700",
    resolved: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  const labels: Record<string, string> = {
    active: "Actif",
    acknowledged: "Accusé",
    resolved: "Résolu",
    cancelled: "Annulé",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.active}`}>
      {labels[status] ?? status}
    </span>
  );
}

function SosActions({ incident }: { incident: SosIncident }) {
  const acknowledge = useAcknowledgeSos();

  if (incident.status !== "active") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        className="px-3 py-1.5 text-xs"
        onClick={() => acknowledge.mutate({ sosId: incident.id })}
        disabled={acknowledge.isPending}
      >
        Accuser
      </Button>
    </div>
  );
}
