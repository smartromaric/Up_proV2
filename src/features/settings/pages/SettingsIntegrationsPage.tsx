"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import { PaydunyaConfigCard } from "../components/PaydunyaConfigCard";
import { isLegacyPlatformSettings } from "../api/adminPlatformConfig.service";
import {
  useIntegrationsList,
  useToggleIntegration,
} from "../api/settingsExtended.queries";
import type { PlatformIntegration } from "../api/settingsExtended.service";

const CATEGORY_LABELS: Record<PlatformIntegration["category"], string> = {
  payment: "Paiement",
  maps: "Cartographie",
  messaging: "Messagerie",
  monitoring: "Monitoring",
};

export function SettingsIntegrationsPage() {
  const legacy = isLegacyPlatformSettings();
  const { data, isLoading, isError } = useIntegrationsList();
  const toggle = useToggleIntegration();

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les intégrations.</p>;
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Intégrations" breadcrumb={["Admin", "Paramètres"]} />

      {!legacy && (
        <div className="mb-8 space-y-4">
          <PaydunyaConfigCard />
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-heading">Météo & zones chaudes</h2>
            <p className="mt-1 text-xs text-muted">
              Configuration du cache météo et refresh BullMQ pour le calcul surge.
            </p>
            <Link href="/admin/settings/weather" className="mt-3 inline-block">
              <Button variant="secondary" className="!text-xs">
                Ouvrir configuration météo →
              </Button>
            </Link>
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-heading">
        {legacy ? "Intégrations" : "Autres intégrations (mock v2)"}
      </h2>

      {isLoading ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="flex animate-pulse items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-navy/10" />
                <div className="h-3 w-56 rounded bg-navy/8" />
              </div>
              <div className="h-9 w-24 rounded-lg bg-navy/10" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {(data?.data ?? []).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <div>
                <p className="font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted">
                  {CATEGORY_LABELS[item.category]}
                  {item.last_sync_at
                    ? ` · Sync ${formatDateTime(item.last_sync_at)}`
                    : " · Jamais synchronisé"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === "connected"
                      ? "bg-teal/15 text-teal-dark"
                      : "bg-canvas text-muted"
                  }`}
                >
                  {item.status === "connected" ? "Connecté" : "Déconnecté"}
                </span>
                <Button
                  variant="secondary"
                  className="!text-xs"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({
                      id: item.id,
                      connected: item.status !== "connected",
                    })
                  }
                >
                  {item.status === "connected" ? "Déconnecter" : "Connecter"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
