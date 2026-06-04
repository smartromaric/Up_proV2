"use client";

import Link from "next/link";
import type { DashboardAdminAlert } from "@/shared/types";

interface AdminDashboardAlertsProps {
  alerts: DashboardAdminAlert[];
  className?: string;
}

const SEVERITY_DOT: Record<DashboardAdminAlert["severity"], string> = {
  info: "bg-teal/70 ring-teal/20",
  warning: "bg-white/50 ring-white/20",
  critical: "bg-white/70 ring-white/25",
};

const ALERT_HINTS: Record<string, string> = {
  KYC_PENDING: "Dossiers en file d'attente de validation",
  WITHDRAWALS_PENDING: "Demandes de retrait à approuver",
  DRIVERS_PENDING_APPROVAL: "Comptes chauffeurs non encore activés",
};

export function AdminDashboardAlerts({
  alerts,
  className = "",
}: AdminDashboardAlertsProps) {
  if (!alerts.length) return null;

  return (
    <div
      className={`kpi-card kpi-card--compact kpi-card--slate kpi-card__grain relative rounded-card p-4 text-white sm:p-5 ${className}`}
    >
      <div className="kpi-card__pattern kpi-card__pattern--waves" aria-hidden />
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-teal/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[1]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
          À traiter
        </p>
        <p className="mt-0.5 text-xs text-white/55">Actions prioritaires</p>

        <ul className="mt-3.5 divide-y divide-white/10">
          {alerts.map((alert) => {
            const hint = ALERT_HINTS[alert.code];
            const row = (
              <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-0 ${SEVERITY_DOT[alert.severity]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="text-sm font-medium leading-snug text-white/95">
                      {alert.label}
                    </p>
                    {alert.count > 0 && (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                        {alert.count}
                      </span>
                    )}
                  </div>
                  {hint && (
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {hint}
                    </p>
                  )}
                </div>
                <span
                  className="mt-0.5 shrink-0 text-xs text-white/40 transition-colors group-hover:text-teal/90"
                  aria-hidden
                >
                  →
                </span>
              </div>
            );

            return (
              <li key={alert.code}>
                <Link
                  href={alert.href}
                  className="group -mx-1 block rounded-lg px-1 transition-colors hover:bg-white/5"
                >
                  {row}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
