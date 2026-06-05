"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { KPI_DARK_VARIANTS, type KpiVariant } from "@/shared/ui/KpiCard";

export type BoneTone = "on-dark" | "on-surface";

const KPI_PATTERN: Record<string, string> = {
  midnight: "kpi-card__pattern--rings",
  "deep-teal": "kpi-card__pattern--mesh",
  slate: "kpi-card__pattern--waves",
  charcoal: "kpi-card__pattern--mesh",
};

const KPI_ORB: Record<string, string> = {
  midnight: "bg-teal/15",
  "deep-teal": "bg-white/10",
  slate: "bg-teal/12",
  charcoal: "bg-white/8",
};

export function Bone({
  className = "",
  tone = "on-surface",
  style,
}: {
  className?: string;
  tone?: BoneTone;
  style?: React.CSSProperties;
}) {
  const toneClass =
    tone === "on-dark" ? "bg-white/15" : "bg-navy/10 dark:bg-white/10";

  return (
    <div
      className={`animate-pulse rounded-lg ${toneClass} ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/** Hero navy — même rendu que HeroTripsTodayKpi */
export function HeroKpiSkeleton() {
  return (
    <section className="hero-grain kpi-card--navy relative overflow-hidden rounded-hero bg-gradient-to-br from-[#243049] via-navy-hero to-navy p-8 text-white shadow-[0_4px_24px_rgba(47,61,102,0.35)] md:p-10">
      <div
        className="kpi-card__pattern kpi-card__pattern--rings absolute inset-0"
        aria-hidden
      />
      <div
        className="kpi-card__pattern kpi-card__pattern--mesh absolute inset-0 opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-teal/30 blur-3xl"
        aria-hidden
      />
      <div className="relative z-[1]">
        <Bone tone="on-dark" className="h-3 w-36" />
        <Bone tone="on-dark" className="mt-2 h-3 w-48" />
        <Bone tone="on-dark" className="mt-4 h-12 w-28" />
        <div className="mt-4 flex items-center gap-2">
          <Bone tone="on-dark" className="h-6 w-20 rounded-full bg-teal/25" />
          <Bone tone="on-dark" className="h-3 w-14" />
        </div>
      </div>
    </section>
  );
}

export function KpiCardSkeleton({
  variant,
  compact = false,
}: {
  variant: KpiVariant;
  compact?: boolean;
}) {
  const v = variant as (typeof KPI_DARK_VARIANTS)[number];
  return (
    <div
      className={`kpi-card kpi-card__grain relative rounded-card text-white kpi-card--${v} ${compact ? "kpi-card--compact p-4 sm:p-5" : "p-6"}`}
    >
      <div className={`kpi-card__pattern ${KPI_PATTERN[v]}`} aria-hidden />
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-3xl ${KPI_ORB[v]}`}
        aria-hidden
      />
      <div className="relative z-[1]">
        <Bone tone="on-dark" className="h-3 w-32" />
        <Bone
          tone="on-dark"
          className={`${compact ? "mt-2 h-7" : "mt-3 h-9"} w-28`}
        />
        <Bone tone="on-dark" className="mt-2 h-3 w-full max-w-[220px]" />
      </div>
    </div>
  );
}

export function ChartFluxSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <Bone className="mb-1 h-4 w-36" />
      <Bone className="mb-6 h-3 w-44" />
      <div className="flex h-48 items-end justify-between gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              <Bone
                className="w-2 max-w-[12px] rounded-t bg-navy/35"
                style={{ height: `${35 + (i % 4) * 18}%` } as React.CSSProperties}
              />
              <Bone
                className="w-2 max-w-[12px] rounded-t bg-teal/30"
                style={{ height: `${25 + (i % 3) * 15}%` } as React.CSSProperties}
              />
            </div>
            <Bone className="h-2 w-6" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4">
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

export function TableBlockSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="border-b border-border px-6 py-4">
        <Bone className="mb-1.5 h-4 w-36" />
        <Bone className="h-3 w-52" />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted">
            {Array.from({ length: 5 }).map((_, i) => (
              <th key={i} className="px-6 py-3 font-medium">
                <Bone className="h-3 w-14" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="h-[52px] border-t border-border/50">
              <td className="px-6 py-3">
                <Bone className="h-4 w-20" />
              </td>
              <td className="px-6 py-3">
                <Bone className="mb-1.5 h-3.5 w-32" />
                <Bone className="h-3 w-24" />
              </td>
              <td className="px-6 py-3">
                <Bone className="h-4 w-24" />
              </td>
              <td className="px-6 py-3">
                <Bone className="h-4 w-16" />
              </td>
              <td className="px-6 py-3">
                <Bone className="h-6 w-20 rounded-full bg-teal/15" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeaderSkeleton({
  title,
  breadcrumb,
  showAction = false,
}: {
  title: string;
  breadcrumb?: string[];
  showAction?: boolean;
}) {
  return (
    <PageHeader
      title={title}
      breadcrumb={breadcrumb}
      actions={
        showAction ? (
          <div className="flex min-w-[200px] flex-col gap-1 sm:min-w-[240px]">
            <Bone className="h-3 w-16" />
            <Bone className="h-10 w-full rounded-lg bg-navy/12" />
          </div>
        ) : undefined
      }
    />
  );
}

export { KPI_DARK_VARIANTS };
