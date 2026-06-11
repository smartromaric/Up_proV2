"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { useFranchisePartnerDetail } from "../api/partners.queries";

interface FranchisePartnerDetailPageProps {
  partnerId: string;
}

export function FranchisePartnerDetailPage({ partnerId }: FranchisePartnerDetailPageProps) {
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const { data, isLoading, isError } = useFranchisePartnerDetail(partnerId);

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Partenaire"
        breadcrumb={["Franchise", "Partenaires"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Partenaire introuvable.{" "}
        <Link href="/franchise/partners" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky résumé */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={data.name}
          breadcrumb={["Franchise", "Partenaires", data.name]}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {data.status === "pending" || data.status === "suspended" ? (
                <Button type="button" onClick={() => setConfirmActivate(true)}>
                  {data.status === "suspended" ? "Réactiver" : "Approuver"}
                </Button>
              ) : null}
              {data.status === "active" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmSuspend(true)}
                >
                  Suspendre
                </Button>
              ) : null}
              <EntityStatusPill status={data.status} />
            </div>
          }
        />
        <p className="text-sm text-muted">
          {data.city} · {data.contact_email} · {data.contact_phone}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Revenus / mois"
              value={formatFCFA(data.revenue_month_fcfa ?? 0)}
            />
            <KpiCard
              label="Chauffeurs"
              value={String(data.drivers_count ?? 0)}
            />
            <KpiCard
              label="Véhicules"
              value={String(data.vehicles_count ?? 0)}
            />
            <KpiCard
              label="Inscrit le"
              value={formatDateTime(data.created_at)}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Coordonnées</h3>
            <dl className="mt-3 space-y-2 text-sm text-muted">
              <div className="flex justify-between gap-2">
                <dt>Raison sociale</dt>
                <dd className="text-foreground">{data.legal_name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Email</dt>
                <dd className="text-foreground">{data.contact_email ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Téléphone</dt>
                <dd className="text-foreground">{data.contact_phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Adresse</dt>
                <dd className="text-right text-foreground">{data.address ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmActivate}
        title={data.status === "suspended" ? "Réactiver ce partenaire ?" : "Approuver ce partenaire ?"}
        message="Le partenaire pourra à nouveau recevoir des courses et gérer ses chauffeurs."
        confirmLabel={data.status === "suspended" ? "Réactiver" : "Approuver"}
        onConfirm={() => {
          setConfirmActivate(false);
        }}
        onCancel={() => setConfirmActivate(false)}
      />

      <ConfirmModal
        open={confirmSuspend}
        title="Suspendre ce partenaire ?"
        message="Le partenaire ne pourra plus recevoir de courses tant que le compte est suspendu."
        confirmLabel="Suspendre"
        variant="danger"
        onConfirm={() => {
          setConfirmSuspend(false);
        }}
        onCancel={() => setConfirmSuspend(false)}
      />
    </div>
  );
}
