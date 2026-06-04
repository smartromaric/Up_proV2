"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { FranchiseCampaign } from "../api/marketing.service";
import { useCreateFranchiseCampaign } from "../api/marketing.queries";

export function FranchiseCampaignNewPage() {
  const router = useRouter();
  const create = useCreateFranchiseCampaign();
  const [values, setValues] = useState({
    name: "",
    channel: "push" as FranchiseCampaign["channel"],
    audience: "",
    status: "draft" as FranchiseCampaign["status"],
    starts_at: new Date().toISOString().slice(0, 10),
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-lg">
      <PageHeader
        title="Nouvelle campagne"
        breadcrumb={["Franchise", "Marketing", "Campagnes", "Nouvelle"]}
      />

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              name: values.name,
              channel: values.channel,
              audience: values.audience,
              status: values.status,
              starts_at: new Date(values.starts_at).toISOString(),
              ends_at: new Date(values.ends_at).toISOString(),
            },
            { onSuccess: () => router.push("/franchise/marketing/campaigns") }
          );
        }}
      >
        <label className="block">
          <span className="text-sm font-medium text-foreground">Nom</span>
          <input
            required
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Canal</span>
          <select
            value={values.channel}
            onChange={(e) => set({ channel: e.target.value as FranchiseCampaign["channel"] })}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="push">Push</option>
            <option value="sms">SMS</option>
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Audience</span>
          <input
            required
            value={values.audience}
            onChange={(e) => set({ audience: e.target.value })}
            placeholder="Ex. Clients actifs Cocody"
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Début</span>
            <input
              type="date"
              required
              value={values.starts_at}
              onChange={(e) => set({ starts_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Fin</span>
            <input
              type="date"
              required
              value={values.ends_at}
              onChange={(e) => set({ ends_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Statut</span>
          <select
            value={values.status}
            onChange={(e) => set({ status: e.target.value as FranchiseCampaign["status"] })}
            className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifiée</option>
            <option value="running">En cours</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : "Créer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
