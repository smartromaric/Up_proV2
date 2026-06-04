"use client";

import { useMemo, useState } from "react";
import { useFranchiseClientsList } from "../api/clients.queries";

export interface PromoUserSelection {
  id: number;
  full_name: string;
  phone: string;
}

interface FranchisePromoUserPickerProps {
  value: PromoUserSelection[];
  onChange: (users: PromoUserSelection[]) => void;
  disabled?: boolean;
}

export function FranchisePromoUserPicker({
  value,
  onChange,
  disabled,
}: FranchisePromoUserPickerProps) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useFranchiseClientsList({
    search: search.trim() || undefined,
    per_page: 50,
    status: "active",
  });

  const clients = data?.data ?? [];
  const selectedIds = useMemo(() => new Set(value.map((u) => u.id)), [value]);

  const toggle = (user: PromoUserSelection) => {
    if (selectedIds.has(user.id)) {
      onChange(value.filter((u) => u.id !== user.id));
    } else {
      onChange([...value, user]);
    }
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(u)}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal-dark transition-colors hover:bg-teal/15 disabled:opacity-50"
              >
                {u.full_name}
                <span aria-hidden className="text-teal/70">
                  ×
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        type="search"
        disabled={disabled}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un client…"
        className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2 disabled:opacity-50"
      />

      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-canvas">
        {isLoading ? (
          <p className="px-3 py-4 text-xs text-muted">Chargement…</p>
        ) : clients.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted">Aucun client trouvé.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {clients.map((c) => {
              const user: PromoUserSelection = {
                id: c.id,
                full_name: c.full_name,
                phone: c.phone,
              };
              const checked = selectedIds.has(c.id);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={checked}
                      onChange={() => toggle(user)}
                      className="mt-0.5 rounded border-border"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {c.full_name}
                      </span>
                      <span className="block text-xs text-muted">{c.phone}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted">
        {value.length === 0
          ? "Sélectionnez au moins un utilisateur pour un code ciblé."
          : `${value.length} utilisateur${value.length > 1 ? "s" : ""} sélectionné${value.length > 1 ? "s" : ""}.`}
      </p>
    </div>
  );
}
