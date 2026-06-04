interface DashboardUsersKpiProps {
  usersRegistered: number;
  clientsOrderedToday: number;
}

/** Inscrits plateforme + clients ayant commandé aujourd'hui */
export function DashboardUsersKpi({
  usersRegistered,
  clientsOrderedToday,
}: DashboardUsersKpiProps) {
  return (
    <div className="kpi-card kpi-card--compact kpi-card--charcoal kpi-card__grain relative rounded-card p-4 text-white sm:p-5">
      <div className="kpi-card__pattern kpi-card__pattern--mesh" aria-hidden />
      <div className="relative z-[1]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
          Utilisateurs & clients
        </p>

        <p className="kpi-card__value mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">
          {usersRegistered.toLocaleString("fr-CI")}
        </p>

        <p className="mt-1 truncate text-xs leading-snug text-white/75">
          Inscrits · total plateforme
        </p>

        <p className="mt-1.5 text-xs text-white/70">
          <span className="font-semibold tabular-nums text-white">
            {clientsOrderedToday.toLocaleString("fr-CI")}
          </span>{" "}
          clients · commandé aujourd&apos;hui
        </p>

        <p className="mt-1 text-[10px] leading-snug text-white/50">
          Clients distincts avec au moins une course du jour
        </p>
      </div>
    </div>
  );
}
