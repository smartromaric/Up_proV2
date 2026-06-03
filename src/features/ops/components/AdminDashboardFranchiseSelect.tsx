"use client";

import type { DashboardAdminFranchiseOption } from "@/shared/types";

interface AdminDashboardFranchiseSelectProps {
  options: DashboardAdminFranchiseOption[];
  value: number | null;
  onChange: (franchiseId: number | null) => void;
  disabled?: boolean;
}

export function AdminDashboardFranchiseSelect({
  options,
  value,
  onChange,
  disabled,
}: AdminDashboardFranchiseSelectProps) {
  return (
    <label className="flex min-w-[200px] flex-col gap-1 sm:min-w-[240px]">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        Périmètre
      </span>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? Number(v) : null);
        }}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
      >
        <option value="">Toutes les franchises</option>
        {options.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name} · {f.city}
          </option>
        ))}
      </select>
    </label>
  );
}
