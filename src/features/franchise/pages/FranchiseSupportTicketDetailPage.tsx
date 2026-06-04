"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { formatDateTime } from "@/shared/lib/format";
import { FranchiseSupportMessageThread } from "../components/FranchiseSupportMessageThread";
import type { SupportReporterType } from "../api/support.service";
import {
  useFranchiseSupportTicket,
  useReplyFranchiseTicket,
} from "../api/support.queries";

const REPORTER_LABELS: Record<SupportReporterType, string> = {
  partner: "Partenaire",
  driver: "Chauffeur",
  client: "Client",
};

const STATUS_LABELS = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
} as const;

interface FranchiseSupportTicketDetailPageProps {
  ticketId: string;
}

export function FranchiseSupportTicketDetailPage({
  ticketId,
}: FranchiseSupportTicketDetailPageProps) {
  const { data, isLoading, isError } = useFranchiseSupportTicket(ticketId);
  const reply = useReplyFranchiseTicket(ticketId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Ticket introuvable.{" "}
        <Link href="/franchise/support" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const closed = data.status === "resolved";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={data.subject}
        breadcrumb={["Franchise", "Support", "Tickets", data.id]}
      />

      <p className="mb-6 text-sm">
        <Link href="/franchise/support" className="text-teal hover:underline">
          ← Retour aux tickets
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Émetteur
            </p>
            <p className="mt-1 font-medium text-foreground">{data.reporter_name}</p>
            <p className="text-sm text-muted">{REPORTER_LABELS[data.reporter_type]}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Statut
            </p>
            <p className="mt-1 text-sm">{STATUS_LABELS[data.status]}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Catégorie
            </p>
            <p className="mt-1 text-sm capitalize">{data.category}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Créé le
            </p>
            <p className="mt-1 text-sm">{formatDateTime(data.created_at)}</p>
          </div>
        </aside>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-heading">Fil de discussion</h2>
          <FranchiseSupportMessageThread
            messages={data.messages}
            disabled={closed}
            isSending={reply.isPending}
            onSend={(body) => reply.mutate(body)}
            placeholder={
              closed ? "Ticket résolu" : "Répondre au ticket…"
            }
          />
        </div>
      </div>
    </div>
  );
}
