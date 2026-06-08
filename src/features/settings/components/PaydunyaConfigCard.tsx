"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import type { PaydunyaConfigDocument } from "../api/adminPlatformConfig.api.types";
import {
  usePaydunyaConfig,
  useUpdatePaydunyaConfig,
} from "../api/adminPlatformConfig.queries";

export function PaydunyaConfigCard() {
  const { data, isLoading, isError } = usePaydunyaConfig();
  const update = useUpdatePaydunyaConfig();
  const [form, setForm] = useState<PaydunyaConfigDocument | null>(null);

  useEffect(() => {
    if (data?.document) setForm({ ...data.document });
  }, [data?.document]);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="h-5 w-40 rounded bg-navy/10" />
        <div className="mt-4 h-24 rounded bg-navy/8" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger la configuration PayDunya (API v1).
      </p>
    );
  }

  const ciChannels = form.enabledChannels?.CI ?? [];

  return (
    <form
      className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate(form);
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-heading">PayDunya</h2>
          <p className="text-xs text-muted">
            GET/PUT /v1/admin/paydunya-config
            {data?.fromDatabase ? " · base de données" : " · template"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Activé
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Mode</span>
          <select
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          >
            <option value="test">Test</option>
            <option value="live">Production</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Frais payés par</span>
          <select
            value={form.feesPayer ?? "customer"}
            onChange={(e) => setForm({ ...form, feesPayer: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          >
            <option value="customer">Client</option>
            <option value="merchant">Marchand</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Boutique — nom</span>
        <input
          value={form.store?.name ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              store: { ...form.store, name: e.target.value },
            })
          }
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
        />
      </label>

      <div>
        <p className="text-sm font-medium">Canaux Côte d&apos;Ivoire</p>
        <p className="mt-1 text-xs text-muted">
          {ciChannels.length > 0 ? ciChannels.join(", ") : "Aucun canal CI"}
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Enregistrement…" : "Enregistrer PayDunya"}
        </Button>
      </div>
    </form>
  );
}
