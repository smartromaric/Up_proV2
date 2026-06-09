"use client";

import type { KycDocument } from "@/shared/types";
import {
  isPdfPreviewUrl,
  resolveKycPreviewUrl,
} from "@/shared/lib/documentPreview";
import { formatDateTime } from "@/shared/lib/format";
import { DocumentPreviewThumbnail } from "./DocumentPreviewThumbnail";
import { Button } from "./Button";

const STATUS_LABELS: Record<KycDocument["status"], string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Rejeté",
};

const STATUS_STYLES: Record<KycDocument["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal/15 text-teal-dark",
  rejected: "bg-red-50 text-red-600",
};

function aggregateGroupStatus(
  documents: KycDocument[]
): KycDocument["status"] {
  if (documents.some((doc) => doc.status === "rejected")) return "rejected";
  if (documents.some((doc) => doc.status === "pending")) return "pending";
  return "approved";
}

function formatSideLabel(side?: string): string {
  const key = String(side ?? "").toUpperCase();
  if (key === "FRONT") return "Recto";
  if (key === "BACK") return "Verso";
  if (key === "SELFIE") return "Selfie";
  return side?.trim() || "Face";
}

interface KycDocumentGroupCardProps {
  label: string;
  documents: KycDocument[];
  canReview?: boolean;
  onApprove?: (documentId: string) => void;
  onReject?: (documentId: string) => void;
}

export function KycDocumentGroupCard({
  label,
  documents,
  canReview,
  onApprove,
  onReject,
}: KycDocumentGroupCardProps) {
  const groupStatus = aggregateGroupStatus(documents);

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted">
            {documents.length} faces · recto et verso
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[groupStatus]}`}
        >
          {STATUS_LABELS[groupStatus]}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {documents.map((document) => {
          const previewUrl = resolveKycPreviewUrl(document);
          const isPdf = isPdfPreviewUrl(previewUrl);
          const fallbackSrc = resolveKycPreviewUrl({
            type: document.type,
            preview_url: undefined,
          });
          const sideLabel = formatSideLabel(document.document_side);
          const hasUpload = Boolean(document.uploaded_at);

          return (
            <div
              key={document.id}
              className="rounded-lg border border-border bg-canvas p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{sideLabel}</p>
                {hasUpload && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[document.status]}`}
                  >
                    {STATUS_LABELS[document.status]}
                  </span>
                )}
              </div>

              {hasUpload ? (
                <DocumentPreviewThumbnail
                  src={previewUrl}
                  alt={`${label} — ${sideLabel}`}
                  isPdf={isPdf}
                  fallbackSrc={fallbackSrc}
                  subtitle={`Soumis le ${formatDateTime(document.uploaded_at)}`}
                />
              ) : (
                <div className="flex min-h-[6rem] items-center justify-center rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-muted">
                  Face manquante
                </div>
              )}

              {document.status_note && (
                <p className="mt-2 text-xs text-red-600">{document.status_note}</p>
              )}

              {canReview &&
                document.status === "pending" &&
                hasUpload &&
                !document.id.startsWith("slot-") && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      className="flex-1 !py-1.5 !text-xs"
                      onClick={() => onApprove?.(document.id)}
                    >
                      Valider
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 !py-1.5 !text-xs"
                      onClick={() => onReject?.(document.id)}
                    >
                      Rejeter
                    </Button>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
