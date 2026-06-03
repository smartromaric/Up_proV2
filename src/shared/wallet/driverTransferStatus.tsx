import type { PartnerDriverTransfer } from "@/shared/types";

export const DRIVER_TRANSFER_STATUS: Record<
  PartnerDriverTransfer["status"],
  { label: string; className: string }
> = {
  completed: { label: "Crédité app", className: "bg-teal/15 text-teal-dark" },
  pending: { label: "En cours", className: "bg-amber-50 text-amber-700" },
  failed: { label: "Échoué", className: "bg-red-50 text-red-600" },
};

export function DriverTransferStatusBadge({
  status,
}: {
  status: PartnerDriverTransfer["status"];
}) {
  const s = DRIVER_TRANSFER_STATUS[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
