"use client";

import Link from "next/link";
import type { AdminFinanceDashboard, FinanceAlertSeverity } from "@/shared/types";

const SEVERITY_DOT: Record<FinanceAlertSeverity, string> = {
  info: "bg-teal/70 ring-teal/20",
  warning: "bg-white/50 ring-white/20",
  critical: "bg-white/70 ring-white/25",
};

interface FinanceAlertsPanelProps {
  alerts: AdminFinanceDashboard["alerts"];
}

export function FinanceAlertsPanel({ alerts }: FinanceAlertsPanelProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="kpi-card kpi-card--compact kpi-card--slate kpi-card__grain relative flex h-full min-h-[280px] flex-col rounded-card p-4 text-white sm:p-5">
      <div className="kpi-card__pattern kpi-card__pattern--waves" aria-hidden />

      <div className="relative z-[1] flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
          À suivre
        </p>
        <p className="mt-0.5 text-xs text-white/55">Priorités du jour</p>

        <ul className="mt-4 flex flex-1 flex-col divide-y divide-white/10">
          {alerts.map((alert) => {
            const content = (
              <div className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-0 ${SEVERITY_DOT[alert.severity]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-white/95">
                    {alert.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    {alert.description}
                  </p>
                </div>
                {alert.href ? (
                  <span
                    className="mt-0.5 shrink-0 text-xs text-white/40 transition-colors group-hover:text-teal/90"
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
              </div>
            );

            return (
              <li key={alert.id}>
                {alert.href ? (
                  <Link
                    href={alert.href}
                    className="group -mx-1 block rounded-lg px-1 transition-colors hover:bg-white/5"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="-mx-1 px-1">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
