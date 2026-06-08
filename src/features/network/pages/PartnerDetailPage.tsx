"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { AvailabilityPill } from "@/shared/ui/DriverPills";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getDriverAvailabilityLabel } from "@/shared/lib/driverLabels";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { PartnerDetail } from "@/shared/types";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { usePartnerDetail } from "../api/partnerDetail.queries";

interface PartnerDetailPageProps {
  partnerId: string;
}

export function PartnerDetailPage({ partnerId }: PartnerDetailPageProps) {
  const [tab, setTab] = useState("overview");
  const { data, isLoading, isError } = usePartnerDetail(partnerId);

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Partenaire"
        breadcrumb={["Admin", "Réseau", "Partenaires"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Partenaire introuvable.{" "}
        <Link href="/admin/network/partners" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const tripCols: Column<PartnerDetail["recent_trips"][0]>[] = [
    {
      id: "ref",
      header: "Référence",
      cell: (t) => (
        <Link
          href={`/admin/ops/trips/${t.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {t.ref}
        </Link>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "created_at",
      header: "Date",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => t.created_at,
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums",
      cell: (t) => formatFCFA(t.amount_fcfa),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <StatusPill status={t.status} />,
      exportValue: (t) => getTripStatusLabel(t.status),
    },
  ];

  const driverCols: Column<PartnerDetail["drivers"][0]>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <Link
          href={`/admin/fleet/drivers/${d.id}`}
          className="font-medium text-foreground hover:text-teal"
        >
          {d.name}
        </Link>
      ),
      exportValue: (d) => d.name,
    },
    {
      id: "availability",
      header: "Statut",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
    {
      id: "rating",
      header: "Note",
      cell: (d) => (d.rating > 0 ? d.rating.toFixed(2) : "—"),
      exportValue: (d) => (d.rating > 0 ? d.rating : ""),
    },
  ];

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={data.name}
          breadcrumb={["Admin", "Réseau", "Partenaires", data.name]}
          actions={<EntityStatusPill status={data.status} />}
        />
        <p className="text-sm text-muted">
          <Link
            href={`/admin/network/franchises/${data.franchise_id}`}
            className="text-teal hover:underline"
          >
            {data.franchise_name}
          </Link>
          {" · "}
          {data.city} · {data.contact_email}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <Tabs
            tabs={[
              { id: "overview", label: "Aperçu" },
              { id: "drivers", label: "Chauffeurs" },
              { id: "trips", label: "Courses" },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-6">
            {tab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard
                  label="Revenus / mois"
                  value={formatFCFA(data.stats.revenue_month_fcfa)}
                />
                <KpiCard label="Courses / mois" value={String(data.stats.trips_month)} />
                <KpiCard
                  label="Chauffeurs"
                  value={`${data.stats.drivers_online} en ligne / ${data.stats.drivers_count}`}
                />
              </div>
            )}

            {tab === "drivers" && (
              <DataTable
                columns={driverCols}
                data={data.drivers}
                rowKey={(d) => d.id}
                exportFileName="chauffeurs-partenaire-detail"
                emptyTitle="Aucun chauffeur"
              />
            )}

            {tab === "trips" && (
              <DataTable
                columns={tripCols}
                data={data.recent_trips}
                rowKey={(t) => t.id}
                exportFileName="courses-partenaire-detail"
                emptyTitle="Aucune course"
                emptyDescription="Aucune course récente pour ce partenaire."
              />
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-heading">
              {formatFCFA(data.wallet?.balance_fcfa ?? data.stats.wallet_balance_fcfa)}
            </p>
            {data.wallet ? (
              <p className="mt-1 text-sm text-muted">
                Disponible : {formatFCFA(data.wallet.available_fcfa)}
              </p>
            ) : data.wallet_id ? (
              <p className="mt-1 text-xs text-muted">ID {data.wallet_id.slice(0, 8)}…</p>
            ) : null}
            {(data.wallet?.pending_withdrawal_fcfa ?? data.stats.pending_withdrawal_fcfa) > 0 && (
              <p className="mt-2 text-sm text-amber-700">
                {formatFCFA(
                  data.wallet?.pending_withdrawal_fcfa ??
                    data.stats.pending_withdrawal_fcfa
                )}{" "}
                en attente de retrait
              </p>
            )}
            {!data.wallet && !data.wallet_id ? (
              <p className="mt-3 text-sm text-muted">
                Aucun portefeuille associé à ce partenaire.
              </p>
            ) : null}
            {data.wallet?.recent_movements?.length ? (
              <ul className="mt-4 space-y-3 border-t border-border pt-4">
                {data.wallet.recent_movements.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{m.label}</p>
                      <p className="text-xs text-muted">{formatDateTime(m.created_at)}</p>
                    </div>
                    <span
                      className={`shrink-0 tabular-nums font-medium ${
                        m.direction === "credit" ? "text-teal-dark" : "text-red-600"
                      }`}
                    >
                      {m.direction === "debit" ? "−" : "+"}
                      {formatFCFA(m.amount_fcfa)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/admin/finance/withdrawals">
              <Button variant="secondary" className="mt-4 w-full !text-xs">
                Voir les retraits
              </Button>
            </Link>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 text-sm shadow-card">
            <h3 className="font-semibold">Coordonnées</h3>
            <p className="mt-2 text-muted">{data.address}</p>
            <p className="mt-1 text-muted">{data.contact_phone}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
