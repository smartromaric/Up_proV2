"use client";

import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatDateTime, formatFCFA } from "@/shared/lib/format";
import type { FranchisePromoRedemption } from "../api/promos.service";
import { useFranchisePromoDetail } from "../api/promos.queries";

function promoStatusLabel(status: string) {
  if (status === "active") return "Actif";
  if (status === "expired") return "Expiré";
  return "Brouillon";
}

function promoStatusClass(status: string) {
  if (status === "active") return "bg-teal/15 text-teal-dark";
  if (status === "expired") return "bg-canvas text-muted";
  return "bg-amber-50 text-amber-700";
}

interface FranchisePromoDetailPageProps {
  promoId: string;
}

export function FranchisePromoDetailPage({ promoId }: FranchisePromoDetailPageProps) {
  const { data, isLoading, isError } = useFranchisePromoDetail(promoId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Code promo introuvable.{" "}
        <Link href="/franchise/promos" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const usagePct = Math.min(100, Math.round((data.uses_count / data.max_uses) * 100));
  const discountLabel = data.fixed_discount_fcfa
    ? formatFCFA(data.fixed_discount_fcfa)
    : `${data.discount_pct} %`;

  const redemptionCols: Column<FranchisePromoRedemption>[] = [
    {
      id: "ref",
      header: "Course",
      cell: (r) => (
        <span className="font-mono text-sm font-medium text-foreground">{r.trip_ref}</span>
      ),
      exportValue: (r) => r.trip_ref,
    },
    {
      id: "client",
      header: "Client",
      cell: (r) => r.client_name,
      exportValue: (r) => r.client_name,
    },
    {
      id: "discount",
      header: "Réduction",
      className: "tabular-nums",
      cell: (r) => formatFCFA(r.discount_fcfa),
      exportValue: (r) => r.discount_fcfa,
    },
    {
      id: "date",
      header: "Date",
      cell: (r) => formatDateTime(r.used_at),
      exportValue: (r) => r.used_at,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.code}
        breadcrumb={["Franchise", "Codes promo", data.code]}
        actions={
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${promoStatusClass(data.status)}`}
          >
            {promoStatusLabel(data.status)}
          </span>
        }
      />

      <p className="mb-6 text-sm text-muted">
        <Link href="/franchise/promos" className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
        {" · "}
        {data.label}
        {" · "}
        Territoire {data.territory_name}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard index={0} label="Réduction" value={discountLabel} />
        <KpiCard
          index={1}
          label="Utilisations"
          value={`${data.uses_count} / ${data.max_uses}`}
          hint={`${usagePct} % du plafond`}
        />
        <KpiCard
          index={2}
          label="Expire le"
          value={formatDateTime(data.expires_at).split(" ")[0]}
          hint={formatDateTime(data.expires_at).split(" ").slice(1).join(" ")}
        />
        <KpiCard
          index={3}
          label="Créé le"
          value={formatDateTime(data.created_at).split(" ")[0]}
          hint="Code promo territoire"
        />
      </div>

      <div className="mb-6 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Paramètres</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Code</dt>
            <dd className="mt-1 font-mono font-medium text-foreground">{data.code}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Libellé</dt>
            <dd className="mt-1 text-foreground">{data.label}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Type</dt>
            <dd className="mt-1 text-foreground">
              {data.fixed_discount_fcfa ? "Montant fixe" : "Pourcentage"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Plafond</dt>
            <dd className="mt-1 tabular-nums text-foreground">
              {data.max_uses.toLocaleString("fr-CI")} utilisations
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-muted">Utilisateurs</dt>
            <dd className="mt-2">
              {data.assigned_users.length === 0 ? (
                <span className="text-sm text-foreground">
                  Tous les utilisateurs du territoire
                </span>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {data.assigned_users.map((u) => (
                    <li key={u.id}>
                      <Link
                        href={`/franchise/clients/${u.id}`}
                        className="inline-flex rounded-full border border-border bg-canvas px-3 py-1 text-xs font-medium text-foreground hover:border-teal/40 hover:text-teal"
                      >
                        {u.full_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-heading">Dernières utilisations</h2>
      <DataTable
        columns={redemptionCols}
        data={data.recent_redemptions}
        rowKey={(r) => `${r.trip_ref}-${r.used_at}`}
        exportFileName={`promo-${data.code}-redemptions`}
        emptyTitle="Aucune utilisation"
        emptyDescription="Ce code n'a pas encore été utilisé par un client."
        pagination={false}
      />

      <div className="mt-6">
        <Link href="/franchise/promos/new">
          <Button variant="secondary">Créer un autre code</Button>
        </Link>
      </div>
    </div>
  );
}
