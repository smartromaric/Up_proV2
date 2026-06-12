import type { DriverComplianceStatus } from "@/shared/types";

const COMPLIANCE_LABELS: Record<string, string> = {
  complete: "Complet",
  documents_incomplete: "Documents incomplets",
  vehicle_incomplete: "Véhicule incomplet",
  kyc_incomplete: "KYC incomplet",
  pending: "En attente",
};

const COMPLIANCE_STYLES: Record<string, string> = {
  complete: "bg-teal/15 text-teal-dark",
  documents_incomplete: "bg-amber-50 text-amber-800",
  vehicle_incomplete: "bg-orange-50 text-orange-800",
  kyc_incomplete: "bg-amber-50 text-amber-800",
  pending: "bg-surface-hover text-muted",
};

export function getDriverComplianceLabel(status?: DriverComplianceStatus | null): string {
  if (!status) return "—";
  return COMPLIANCE_LABELS[status] ?? status.replace(/_/g, " ");
}

export function getDriverComplianceStyle(status?: DriverComplianceStatus | null): string {
  if (!status) return "bg-surface-hover text-muted";
  return COMPLIANCE_STYLES[status] ?? "bg-surface-hover text-muted";
}

export const DRIVER_COMPLIANCE_FILTER_OPTIONS = [
  { value: "all" as const, label: "Toutes conformités" },
  { value: "complete" as const, label: "Complet" },
  { value: "documents_incomplete" as const, label: "Documents incomplets" },
  { value: "vehicle_incomplete" as const, label: "Véhicule incomplet" },
  { value: "kyc_incomplete" as const, label: "KYC incomplet" },
];
