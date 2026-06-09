import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA } from "@/shared/lib/format";

interface FinanceTreasuryStripProps {
  totalFcfa: number;
  driverFcfa?: number;
  partnerFcfa?: number;
  clientFcfa?: number;
}

function hasBreakdown(
  totalFcfa: number,
  driverFcfa: number,
  partnerFcfa: number,
  clientFcfa: number
): boolean {
  if (partnerFcfa <= 0 && clientFcfa <= 0) return false;
  const sum = driverFcfa + partnerFcfa + clientFcfa;
  return sum > 0 && sum !== totalFcfa;
}

export function FinanceTreasuryStrip({
  totalFcfa,
  driverFcfa = 0,
  partnerFcfa = 0,
  clientFcfa = 0,
}: FinanceTreasuryStripProps) {
  const showBreakdown = hasBreakdown(totalFcfa, driverFcfa, partnerFcfa, clientFcfa);

  const hint = showBreakdown
    ? `Chauffeurs ${formatFCFA(driverFcfa)} · Partenaires ${formatFCFA(partnerFcfa)} · Clients ${formatFCFA(clientFcfa)}`
    : "Solde consolidé disponible";

  return (
    <KpiCard
      index={2}
      label="Trésorerie consolidée"
      value={formatFCFA(totalFcfa)}
      hint={hint}
    />
  );
}
