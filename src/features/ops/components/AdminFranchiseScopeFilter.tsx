"use client";

import type { LiveMapData } from "@/shared/types";
import { parseScopeId, type ScopeId } from "@/shared/lib/scopeId";

export interface AdminFranchiseScopeValue {
  franchiseId: ScopeId | null;
}

interface AdminFranchiseScopeFilterProps {
  options: NonNullable<LiveMapData["filter_options"]>;
  value: AdminFranchiseScopeValue;
  onChange: (next: AdminFranchiseScopeValue) => void;
}

/** Filtre franchise pour les listes admin (équivalent partenaire côté franchise). */
export function AdminFranchiseScopeFilter({
  options,
  value,
  onChange,
}: AdminFranchiseScopeFilterProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
      <div className="min-w-[200px] flex-1 sm:max-w-[280px]">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Franchise
        </label>
        <select
          value={value.franchiseId ?? ""}
          disabled={options.franchises.length === 0}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ franchiseId: v ? parseScopeId(v) : null });
          }}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2 disabled:opacity-50"
        >
          <option value="">Toutes les franchises</option>
          {options.franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} · {f.city}
            </option>
          ))}
        </select>
      </div>

      {value.franchiseId != null && (
        <button
          type="button"
          onClick={() => onChange({ franchiseId: null })}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
