"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { SelectFilter } from "@/shared/ui/SelectFilter";
import { Button } from "@/shared/ui/Button";
import { formatRatePercent } from "@/shared/lib/commissionRateCoupling";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import type { CommissionRule } from "../api/commissionRules.mapper";
import { useCommissionRulesList } from "../api/commissionRules.queries";

const SCOPE_OPTIONS = [
  { value: "all" as const, label: "Tous périmètres" },
  { value: "global" as const, label: "Globales" },
  { value: "franchise" as const, label: "Franchise" },
  { value: "partner" as const, label: "Partenaire" },
];

export function CommissionRulesListPage() {
  const router = useRouter();
  const [scopeFilter, setScopeFilter] =
    useState<(typeof SCOPE_OPTIONS)[number]["value"]>("all");
  const [search, setSearch] = useState("");

  const { data: rules = [], isLoading, isError } = useCommissionRulesList();

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: search, set: setSearch },
    fields: [
      {
        value: scopeFilter,
        defaultValue: "all",
        reset: () => setScopeFilter("all"),
      },
    ],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (scopeFilter === "global" && (rule.franchise_id || rule.partner_id)) {
        return false;
      }
      if (scopeFilter === "franchise" && (!rule.franchise_id || rule.partner_id)) {
        return false;
      }
      if (scopeFilter === "partner" && !rule.partner_id) return false;
      if (!q) return true;
      return [
        rule.rule_name,
        rule.service_type,
        rule.category_code,
        rule.franchise_id ?? "",
        rule.partner_id ?? "",
      ].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rules, scopeFilter, search]);

  const columns: Column<CommissionRule>[] = [
    {
      id: "name",
      header: "Règle",
      cell: (r) => (
        <div>
          <p className="font-medium text-foreground">{r.rule_name}</p>
          <p className="text-xs text-muted">
            {r.service_type} · {r.category_code}
          </p>
        </div>
      ),
      exportValue: (r) => r.rule_name,
    },
    {
      id: "scope",
      header: "Périmètre",
      cell: (r) => (
        <span className="text-sm text-muted">
          {!r.franchise_id && !r.partner_id
            ? "Global"
            : r.partner_id
              ? "Partenaire"
              : "Franchise"}
        </span>
      ),
      exportValue: (r) =>
        r.partner_id ? "partner" : r.franchise_id ? "franchise" : "global",
    },
    {
      id: "rates",
      header: "Taux (plat. / fr. / part. / ch.)",
      cell: (r) => (
        <span className="text-xs tabular-nums text-foreground">
          {formatRatePercent(r.platform_rate)} / {formatRatePercent(r.franchise_rate)}{" "}
          / {formatRatePercent(r.partner_rate)} / {formatRatePercent(r.driver_rate)}
        </span>
      ),
    },
    {
      id: "priority",
      header: "Priorité",
      className: "tabular-nums",
      cell: (r) => r.priority,
      exportValue: (r) => r.priority,
    },
    {
      id: "active",
      header: "Actif",
      cell: (r) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            r.active ? "bg-teal/15 text-teal-dark" : "bg-navy/10 text-muted"
          }`}
        >
          {r.active ? "Oui" : "Non"}
        </span>
      ),
      exportValue: (r) => (r.active ? "Oui" : "Non"),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <Link
          href={`/admin/finance/commission-rules/${r.id}/edit`}
          className="inline-flex rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
        >
          Modifier
        </Link>
      ),
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les règles de commission.
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Règles de commission"
        breadcrumb={["Admin", "Finance"]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/finance/commissions"
              className="text-sm text-teal hover:underline"
            >
              Commissions calculées →
            </Link>
            <Button
              type="button"
              onClick={() => router.push("/admin/finance/commission-rules/new")}
            >
              Nouvelle règle
            </Button>
          </div>
        }
      />

      <p className="mb-6 max-w-3xl text-sm text-muted">
        Configurez la répartition plateforme / franchise / partenaire / chauffeur.
        Pour un partenaire sous franchise, modifiez le taux partenaire depuis sa
        fiche — le taux franchise s&apos;ajuste automatiquement (pool constant).
      </p>

      <TableFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Règle, service, catégorie…"
        totalLabel={`${filtered.length} règle${filtered.length > 1 ? "s" : ""}`}
        hasActiveFilters={hasActiveFilters}
        onReset={resetAll}
      >
        <SelectFilter
          label="Périmètre"
          value={scopeFilter}
          options={SCOPE_OPTIONS}
          onChange={setScopeFilter}
        />
      </TableFiltersBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        exportFileName="regles-commission"
        emptyTitle="Aucune règle"
        pagination={{ pageSize: 25 }}
      />

    </div>
  );
}
