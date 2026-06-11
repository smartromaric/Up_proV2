"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { Timeline } from "@/shared/ui/Timeline";
import { driverTimelineToItems } from "@/shared/lib/driverTimeline";
import { organizeDriverKycDocuments } from "@/features/fleet/api/kycDocument.mapper";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { KycDocumentGroupCard } from "@/shared/ui/KycDocumentGroupCard";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { RejectReasonModal } from "@/shared/ui/RejectReasonModal";
import { usePermission } from "@/core/auth/usePermission";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import {
  useApproveFranchiseDocument,
  useApproveFranchiseDriverKyc,
  useFranchiseDriverDetail,
  useRejectFranchiseDocument,
  useRejectFranchiseDriverKyc,
} from "../api/drivers.queries";

interface FranchiseDriverDetailPageProps {
  driverId: string;
}

export function FranchiseDriverDetailPage({ driverId }: FranchiseDriverDetailPageProps) {
  const [tab, setTab] = useState("kyc");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectDocTarget, setRejectDocTarget] = useState<string | null>(null);
  const canModerate = usePermission("fleet.kyc.approve");

  const { data: driver, isLoading, isError } = useFranchiseDriverDetail(driverId);
  const approveKyc = useApproveFranchiseDriverKyc();
  const rejectKyc = useRejectFranchiseDriverKyc();
  const approveDoc = useApproveFranchiseDocument(driverId);
  const rejectDoc = useRejectFranchiseDocument(driverId);

  if (isLoading) {
    return (
      <DetailPageSkeleton title="Chauffeur" breadcrumb={["Franchise", "Chauffeurs"]} />
    );
  }

  if (isError || !driver) {
    return (
      <p className="text-sm text-red-600">
        Chauffeur introuvable.{" "}
        <Link href="/franchise/drivers" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;
  const isPending = driver.account_status === "pending";
  const timelineItems = driverTimelineToItems(driver.timeline || []);
  const kycDisplayItems = organizeDriverKycDocuments(driver.kyc_documents || []);

  const tabs = [
    { id: "kyc", label: "KYC & documents" },
    { id: "overview", label: "Aperçu" },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header sticky résumé */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={fullName}
          breadcrumb={["Franchise", "Chauffeurs", fullName]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {isPending && canModerate && (
                <>
                  <Button onClick={() => setConfirmApprove(true)}>
                    Approuver le compte
                  </Button>
                  <Button variant="secondary" onClick={() => setConfirmReject(true)}>
                    Rejeter
                  </Button>
                </>
              )}
            </div>
          }
        />
        <p className="mt-1 text-sm text-muted">
          {driver.driver_code ? (
            <span className="font-medium text-foreground">{driver.driver_code}</span>
          ) : null}
          {driver.driver_code ? " · " : ""}
          {driver.phone ?? "—"}
          {driver.email ? ` · ${driver.email}` : ""} · {driver.zone ?? "—"}
          {driver.owner_name ? ` · ${driver.owner_name}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Contenu onglets */}
        <div className="min-w-0">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          <div className="mt-6">
            {tab === "kyc" && (
              <div className="space-y-4">
                {driver.kyc_documents?.length === 0 ? (
                  <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center">
                    <p className="font-medium text-foreground">Aucun document KYC</p>
                    <p className="mt-2 text-sm text-muted">
                      Les documents soumis par le chauffeur apparaîtront ici
                      (CNI, permis, selfie) avec aperçu et actions de validation.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {kycDisplayItems.map((item) =>
                      item.kind === "group" ? (
                        <div key={item.groupId} className="sm:col-span-2">
                          <KycDocumentGroupCard
                            label={item.label}
                            documents={item.documents}
                            canReview={isPending && canModerate}
                            onApprove={(documentId) => approveDoc.mutate(documentId)}
                            onReject={(documentId) => setRejectDocTarget(documentId)}
                          />
                        </div>
                      ) : (
                        <KycDocumentCard
                          key={item.document.id}
                          document={item.document}
                          canReview={
                            isPending &&
                            canModerate &&
                            item.document.status === "pending" &&
                            Boolean(item.document.uploaded_at) &&
                            !item.document.id.startsWith("slot-")
                          }
                          onApprove={() => approveDoc.mutate(item.document.id)}
                          onReject={() => setRejectDocTarget(item.document.id)}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <KpiCard
                    label="Courses totales"
                    value={String(driver.stats?.trips_total ?? 0)}
                  />
                  <KpiCard
                    label="Taux d'acceptation"
                    value={`${driver.stats?.acceptance_rate_pct ?? 0} %`}
                  />
                  <KpiCard
                    label="Note moyenne"
                    value={driver.rating > 0 ? driver.rating.toFixed(2) : "—"}
                  />
                  <KpiCard
                    label="Véhicule"
                    value={driver.vehicle_label ?? "Non renseigné"}
                  />
                </div>
                <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                  <h3 className="text-sm font-semibold text-foreground">Historique</h3>
                  <div className="mt-4">
                    <Timeline items={timelineItems} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau latéral */}
        <aside className="space-y-4">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Portefeuille
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-heading">
              {formatFCFA(driver.stats?.wallet_balance_fcfa ?? 0)}
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Véhicule assigné</h3>
            <p className="mt-3 text-muted">
              {driver.vehicle_label ?? "Aucun véhicule assigné."}
            </p>
          </div>

          <div className="rounded-card border border-border bg-surface p-5 shadow-card text-sm">
            <h3 className="font-semibold text-foreground">Informations</h3>
            <dl className="mt-3 space-y-2 text-muted">
              <div className="flex justify-between gap-2">
                <dt>Inscrit le</dt>
                <dd className="text-foreground">
                  {driver.registered_at ? formatDateTime(driver.registered_at) : "—"}
                </dd>
              </div>
              {driver.approved_at && (
                <div className="flex justify-between gap-2">
                  <dt>Approuvé le</dt>
                  <dd className="text-foreground">{formatDateTime(driver.approved_at)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt>Partenaire</dt>
                <dd className="text-right text-foreground">
                  {driver.owner_name ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmApprove}
        title="Approuver ce chauffeur ?"
        message="Tous les documents en attente seront validés et le compte pourra recevoir des courses."
        confirmLabel="Approuver"
        onConfirm={() => {
          approveKyc.mutate(driverId);
          setConfirmApprove(false);
        }}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmModal
        open={confirmReject}
        title="Rejeter la demande ?"
        message="Le chauffeur devra corriger ses documents avant une nouvelle validation."
        confirmLabel="Rejeter"
        variant="danger"
        onConfirm={() => {
          rejectKyc.mutate({ driverId, reason: "Documents non conformes" });
          setConfirmReject(false);
        }}
        onCancel={() => setConfirmReject(false)}
      />

      <RejectReasonModal
        open={rejectDocTarget !== null}
        title="Rejeter ce document ?"
        message="Indiquez le motif du rejet. Le chauffeur pourra soumettre un nouveau document."
        confirmLabel="Rejeter le document"
        onConfirm={(reason) => {
          if (rejectDocTarget) {
            rejectDoc.mutate({ docId: rejectDocTarget, reason });
          }
          setRejectDocTarget(null);
        }}
        onCancel={() => setRejectDocTarget(null)}
      />
    </div>
  );
}
