"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import {
  usePartnerDocuments,
  usePartnerDocumentsSummary,
  useUploadPartnerDocument,
} from "../api/profile.queries";

const DOC_TYPES: { value: string; label: string }[] = [
  { value: "BUSINESS_REGISTRATION", label: "RCCM / Registre commerce" },
  { value: "rccm", label: "RCCM" },
  { value: "dfe", label: "Déclaration fiscale (DFE)" },
  { value: "id_card", label: "Pièce d'identité du gérant" },
  { value: "tax_certificate", label: "Attestation fiscale" },
  { value: "insurance", label: "Assurance" },
  { value: "other", label: "Autre document" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Refusé",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";

export function PartnerDocumentsSection() {
  const { data: documents, isLoading, isError } = usePartnerDocuments();
  const { data: summary } = usePartnerDocumentsSummary();
  const upload = useUploadPartnerDocument();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("BUSINESS_REGISTRATION");
  const [file, setFile] = useState<File | null>(null);

  const docTypeLabel = (t: string) =>
    DOC_TYPES.find((d) => d.value === t)?.label ?? t;

  const handleSubmit = () => {
    if (!file || upload.isPending) return;
    upload.mutate(
      { type, filename: file.name },
      {
        onSuccess: () => {
          setOpen(false);
          setFile(null);
          setType("BUSINESS_REGISTRATION");
        },
      }
    );
  };

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Documents légaux</h3>
          <p className="text-xs text-muted">Documents KYC de l'entreprise</p>
        </div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Ajouter un document
        </Button>
      </div>

      {summary && !summary.isComplete && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-semibold">Documents requis manquants</p>
          <p className="mt-1 text-xs">
            {summary.missingTypes.map(docTypeLabel).join(", ")}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {summary.uploadedCount} / {summary.requiredCount} document(s) fourni(s)
          </p>
        </div>
      )}

      {summary && summary.isComplete && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">✓ Dossier complet</p>
          <p className="mt-1 text-xs">
            {summary.approvedCount} validé(s), {summary.pendingCount} en attente, {summary.rejectedCount} refusé(s)
          </p>
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-lg bg-canvas p-8 text-center text-sm text-muted">
            Chargement…
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-canvas p-8 text-center text-sm text-red-600">
            Impossible de charger les documents.
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="rounded-lg bg-canvas p-8 text-center">
            <p className="text-sm text-muted">Aucun document disponible</p>
            <p className="mt-1 text-xs text-muted">
              Ajoutez vos documents légaux pour valider votre compte.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {doc.label ?? docTypeLabel(doc.type)}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {doc.filename ?? doc.type}
                    {doc.created_at ? ` · ${formatDateTime(doc.created_at)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      STATUS_STYLES[doc.status] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {STATUS_LABELS[doc.status] ?? doc.status}
                  </span>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-teal hover:underline"
                    >
                      Voir
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-overlay animate-fade-up"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card animate-fade-up"
          >
            <h2 className="text-lg font-semibold text-heading">Ajouter un document</h2>
            <p className="mt-1 text-sm text-muted">
              Sélectionnez le type et le fichier à téléverser.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Type de document</span>
                <select
                  className={inputClass}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {DOC_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Fichier</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className={inputClass}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button disabled={!file || upload.isPending} onClick={handleSubmit}>
                {upload.isPending ? "Envoi…" : "Téléverser"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
