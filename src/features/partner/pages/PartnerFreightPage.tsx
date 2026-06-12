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
import { usePartnerFreightOffers, useUpdateFreightOffer } from "../api/freight.queries";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import type { FreightOffer } from "../api/freight.service";

export function PartnerFreightPage() {
  const table = useServerTableState([]);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerFreightOffers(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<FreightOffer>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (o) => <div className="font-medium">{o.ref}</div>,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (o) => (
        <div className="text-sm">
          <div>{o.origin_label} → {o.destination_label}</div>
          <div className="text-muted text-xs">{o.distance_km} km</div>
        </div>
      ),
    },
    {
      id: "goods",
      header: "Marchandise",
      cell: (o) => (
        <div className="text-sm">
          <div>{o.goods_type}</div>
          <div className="text-muted text-xs">
            {o.weight_kg && `${o.weight_kg} kg `}
            {o.volume_m3 && `${o.volume_m3} m³`}
          </div>
        </div>
      ),
    },
    {
      id: "client",
      header: "Client",
      cell: (o) => <div className="text-sm text-muted">{o.client_name}</div>,
    },
    {
      id: "price",
      header: "Prix",
      cell: (o) => <div className="font-medium text-teal">{formatFCFA(o.price_fcfa)}</div>,
    },
    {
      id: "status",
      header: "Statut",
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      id: "date",
      header: "Demandé le",
      cell: (o) => <span className="text-muted text-sm">{formatDateTime(o.requested_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (o) => <FreightActions offer={o} />,
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les offres de fret.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Offres de fret"
        breadcrumb={["Partenaire", "Opportunités"]}
        actions={<Button>Voir l'historique</Button>}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Référence, client, origine..."
        totalLabel={meta ? `${meta.total} offre${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(o) => o.id}
        isLoading={isLoading}
        emptyTitle="Aucune offre de fret disponible"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  const labels: Record<string, string> = {
    pending: "En attente",
    accepted: "Acceptée",
    rejected: "Refusée",
    completed: "Terminée",
    cancelled: "Annulée",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}

function FreightActions({ offer }: { offer: FreightOffer }) {
  const update = useUpdateFreightOffer(offer.id);

  if (offer.status !== "pending") {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        className="px-3 py-1.5 text-xs"
        onClick={() => update.mutate({ status: "accepted" })}
        disabled={update.isPending}
      >
        Accepter
      </Button>
      <Button
        className="px-3 py-1.5 text-xs"
        variant="secondary"
        onClick={() => update.mutate({ status: "rejected" })}
        disabled={update.isPending}
      >
        Refuser
      </Button>
    </div>
  );
}
