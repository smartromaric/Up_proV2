"use client";

import { formatFCFA } from "@/shared/lib/format";
import type { AdminFinanceDashboard } from "@/shared/types";

interface FinanceFranchiseBreakdownProps {
  rows: AdminFinanceDashboard["by_franchise"];
}

export function FinanceFranchiseBreakdown({ rows }: FinanceFranchiseBreakdownProps) {
  const maxGmv = Math.max(...rows.map((r) => r.gmv_month_fcfa), 1);

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Performance par franchise</h2>
      <p className="text-xs text-muted">GMV et marge nette du mois</p>
      <ul className="mt-5 space-y-4">
        {rows.map((row) => (
          <li key={row.franchise_id}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <div>
                <span className="font-medium text-foreground">{row.franchise_name}</span>
                <span className="ml-2 text-xs text-muted">{row.city}</span>
              </div>
              <span className="text-xs font-medium text-muted">{row.share_pct}% GMV</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-navy transition-all duration-500"
                style={{ width: `${(row.gmv_month_fcfa / maxGmv) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-muted">
              <span>GMV {formatFCFA(row.gmv_month_fcfa)}</span>
              <span>Marge {formatFCFA(row.margin_fcfa)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
