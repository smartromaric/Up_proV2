"use client";

import { useEffect, useState } from "react";
import { FilterField } from "./FilterField";
import { FILTER_CONTROL_CLASS } from "./filterControlStyles";

export const DASHBOARD_LIVE_REFETCH_MS = 30_000;

interface LiveRefreshIndicatorProps {
  dataUpdatedAt?: number;
  isFetching?: boolean;
  className?: string;
}

function formatRelativeSeconds(ms: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  return `il y a ${minutes} min`;
}

export function LiveRefreshIndicator({
  dataUpdatedAt,
  isFetching = false,
  className = "",
}: LiveRefreshIndicatorProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 5_000);
    return () => window.clearInterval(id);
  }, []);

  const label = dataUpdatedAt
    ? formatRelativeSeconds(dataUpdatedAt)
    : "en attente";

  return (
    <FilterField label="Temps réel" className={`sm:min-w-[220px] ${className}`}>
      <div
        className={`${FILTER_CONTROL_CLASS} flex w-full items-center gap-2 text-xs text-muted`}
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${
              isFetching ? "animate-ping bg-teal/60" : "bg-teal/40"
            }`}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
        </span>
        <span className="min-w-0 truncate">
          <span className="font-medium text-foreground">Live</span>
          {" · "}
          Mis à jour {label}
        </span>
      </div>
    </FilterField>
  );
}
