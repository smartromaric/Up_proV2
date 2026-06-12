import type { ReactNode } from "react";
import { FILTER_LABEL_CLASS } from "./filterControlStyles";

interface TableFiltersPanelProps {
  children: ReactNode;
  className?: string;
}

/** Carte unique regroupant les filtres d'une liste (sections empilées). */
export function TableFiltersPanel({
  children,
  className = "",
}: TableFiltersPanelProps) {
  return (
    <div
      className={`mb-4 overflow-hidden rounded-card border border-border bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

interface TableFiltersSectionProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function TableFiltersSection({
  title,
  children,
  actions,
  className = "",
}: TableFiltersSectionProps) {
  return (
    <section
      className={`border-b border-border p-4 last:border-b-0 ${className}`}
    >
      {(title || actions) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${
            title || actions ? "mb-3" : ""
          }`}
        >
          {title ? (
            <h2 className={`${FILTER_LABEL_CLASS} !text-[11px]`}>{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
