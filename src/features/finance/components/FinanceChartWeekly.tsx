"use client";

interface FinanceChartWeeklyProps {
  data: { day: string; gmv: number; commissions: number; payouts: number }[];
}

export function FinanceChartWeekly({ data }: FinanceChartWeeklyProps) {
  const max = Math.max(
    ...data.flatMap((d) => [d.gmv, d.commissions, d.payouts]),
    1
  );

  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Flux financier — 7 jours</h2>
      <p className="text-xs text-muted">GMV, commissions plateforme et sorties (retraits / payouts)</p>
      <div className="mt-6 flex h-52 items-end justify-between gap-1.5 sm:gap-2">
        {data.map((point, i) => (
          <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-44 w-full items-end justify-center gap-0.5">
              <div
                className="w-1.5 sm:w-2 rounded-t bg-navy transition-all duration-600 ease-out"
                style={{
                  height: `${(point.gmv / max) * 100}%`,
                  transitionDelay: `${i * 35}ms`,
                }}
                title={`GMV ${point.gmv.toLocaleString("fr-CI")}`}
              />
              <div
                className="w-1.5 sm:w-2 rounded-t bg-teal transition-all duration-600 ease-out"
                style={{
                  height: `${(point.commissions / max) * 100}%`,
                  transitionDelay: `${i * 35 + 15}ms`,
                }}
                title={`Commissions ${point.commissions.toLocaleString("fr-CI")}`}
              />
              <div
                className="w-1.5 sm:w-2 rounded-t bg-slate-400/80 transition-all duration-600 ease-out"
                style={{
                  height: `${(point.payouts / max) * 100}%`,
                  transitionDelay: `${i * 35 + 30}ms`,
                }}
                title={`Sorties ${point.payouts.toLocaleString("fr-CI")}`}
              />
            </div>
            <span className="text-[10px] text-muted">{point.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-navy" /> GMV
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-teal" /> Commissions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-400" /> Sorties
        </span>
      </div>
    </div>
  );
}
