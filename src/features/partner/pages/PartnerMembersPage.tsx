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
import { formatDateTime } from "@/shared/lib/format";
import {
  usePartnerMembersList,
  useDeletePartnerMember,
} from "../api/members.queries";
import { PartnerMemberFormModal } from "../components/PartnerMemberFormModal";
import type { PartnerMember } from "../api/members.service";

export function PartnerMembersPage() {
  const table = useServerTableState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerMember | null>(null);
  const [toDelete, setToDelete] = useState<PartnerMember | null>(null);
  const remove = useDeletePartnerMember();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  const { data, isLoading, isError } = usePartnerMembersList(table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (member: PartnerMember) => {
    setEditing(member);
    setFormOpen(true);
  };

  const columns: Column<PartnerMember>[] = [
    {
      id: "name",
      header: "Nom",
      cell: (m) => (
        <div className="font-medium">
          {m.first_name} {m.last_name}
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      cell: (m) => m.email,
    },
    {
      id: "role",
      header: "Rôle",
      cell: (m) => (
        <span className="inline-flex items-center rounded-full bg-teal/10 px-2 py-1 text-xs font-medium text-teal">
          {m.role}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (m) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            m.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {m.status}
        </span>
      ),
    },
    {
      id: "created",
      header: "Ajouté le",
      cell: (m) => <span className="text-muted">{formatDateTime(m.created_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: (m) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => openEdit(m)}
          >
            Modifier
          </Button>
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
            onClick={() => setToDelete(m)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les membres.</p>;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Membres de l'équipe"
        breadcrumb={["Partenaire", "Compte"]}
        actions={<Button onClick={openCreate}>Ajouter un membre</Button>}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Nom, email..."
        totalLabel={meta ? `${meta.total} membre${meta.total > 1 ? "s" : ""}` : undefined}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      />

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(m) => m.id}
        isLoading={isLoading}
        emptyTitle="Aucun membre d'équipe"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />

      <PartnerMemberFormModal
        open={formOpen}
        member={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Supprimer ce membre"
        message={
          toDelete
            ? `Confirmez-vous la suppression de ${toDelete.first_name} ${toDelete.last_name} ? Cette action est irréversible.`
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
