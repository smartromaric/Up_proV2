"use client";

import type { DashboardAdminFranchiseOption } from "@/shared/types";
import { parseScopeId, type ScopeId } from "@/shared/lib/scopeId";
import { FilterField } from "@/shared/ui/FilterField";
import { FILTER_SELECT_CLASS } from "@/shared/ui/filterControlStyles";

interface AdminDashboardFranchiseSelectProps {
  options: DashboardAdminFranchiseOption[];
  value: ScopeId | null;
  onChange: (franchiseId: ScopeId | null) => void;
  disabled?: boolean;
}

export function AdminDashboardFranchiseSelect({
  options,
  value,
  onChange,
  disabled,
}: AdminDashboardFranchiseSelectProps) {
  return (
    <FilterField label="Périmètre" className="min-w-[200px] sm:min-w-[260px]">
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? parseScopeId(v) : null);
        }}
        className={`${FILTER_SELECT_CLASS} font-medium`}
      >
        <option value="">Toutes les franchises</option>
        {options.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name} · {f.city}
          </option>
        ))}
      </select>
    </FilterField>
  );
}
