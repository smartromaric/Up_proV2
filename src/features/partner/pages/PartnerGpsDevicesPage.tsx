"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import { usePartnerGpsDevices, useDeleteGpsDevice } from "../api/gps.queries";
import { PartnerGpsDeviceFormModal } from "../components/PartnerGpsDeviceFormModal";
import { formatDateTime } from "@/shared/lib/format";
import type { GpsDevice } from "../api/gps.service";

export function PartnerGpsDevicesPage() {
  const table = useServerTableState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GpsDevice | null>(null);
  const [toDelete, setToDelete] = useState<GpsDevice | null>(null);
  const remove = useDeleteGpsDevice();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerGpsDevices(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (device: GpsDevice) => {
    setEditing(device);
    setFormOpen(true);
  };

  const columns: Column<GpsDevice>[] = [
    {
      id: "imei",
      header: "IMEI",
      cell: (d) => <div className="font-medium">{d.imei}</div>,
    },
    {
      id: "vehicle",
      header: "Véhicule assigné",
      cell: (d) => d.vehicle_label ?? <span className="text-muted">Non assigné</span>,
    },
    {
      id: "status",
      header: "Statut",
      cell: (d) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            d.status === "online"
              ? "bg-green-100 text-green-700"
              : d.status === "offline"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {d.status}
        </span>
      ),
    },
    {
      id: "battery",
      header: "Batterie",
      cell: (d) =>
        d.battery_level_pct !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-12 rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${
                  d.battery_level_pct > 50
                    ? "bg-green-500"
                    : d.battery_level_pct > 20
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${d.battery_level_pct}%` }}
              />
            </div>
            <span className="text-xs">{d.battery_level_pct}%</span>
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      id: "lastSeen",
      header: "Dernière connexion",
      cell: (d) => <span className="text-muted">{d.last_seen_at ? formatDateTime(d.last_seen_at) : "Jamais"}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (d) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => openEdit(d)}
          >
            Modifier
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            onClick={() => setToDelete(d)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les balises GPS.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Balises GPS"
        breadcrumb={["Partenaire", "Flotte"]}
        actions={<Button onClick={openCreate}>Ajouter un device</Button>}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="IMEI, véhicule..."
        totalLabel={meta ? `${meta.total} device${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        emptyTitle="Aucune balise GPS enregistrée"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />

      <PartnerGpsDeviceFormModal
        open={formOpen}
        device={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Supprimer cette balise GPS"
        message={
          toDelete
            ? `Confirmez-vous la suppression de la balise ${toDelete.imei} ? Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (toDelete) {
            remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
          }
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
