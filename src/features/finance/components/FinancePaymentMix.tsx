"use client";

import { formatFCFA } from "@/shared/lib/format";
import type { AdminFinanceDashboard } from "@/shared/types";

interface FinancePaymentMixProps {
  items: AdminFinanceDashboard["payment_mix"];
}

export function FinancePaymentMix({ items }: FinancePaymentMixProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Répartition des encaissements</h2>
      <p className="text-xs text-muted">Mix des moyens de paiement (mois en cours)</p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.method}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="tabular-nums text-muted">{item.share_pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-teal transition-all duration-500"
                style={{ width: `${item.share_pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted tabular-nums">{formatFCFA(item.amount_fcfa)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
