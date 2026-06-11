"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { COMMISSION_SERVICE_TYPE_LABELS } from "../api/commissionRules.constants";
import { CommissionRuleForm } from "../components/CommissionRuleForm";
import { useCommissionRulesList } from "../api/commissionRules.queries";

const LIST_HREF = "/admin/finance/commission-rules";

interface CommissionRuleEditPageProps {
  ruleId: string;
}

export function CommissionRuleEditPage({ ruleId }: CommissionRuleEditPageProps) {
  const router = useRouter();
  const { data: rules = [], isLoading, isError } = useCommissionRulesList();

  const rule = useMemo(
    () => rules.find((item) => item.id === ruleId) ?? null,
    [ruleId, rules]
  );

  if (isLoading) {
    return <SimplePageSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger la règle de commission.
      </p>
    );
  }

  if (!rule) {
    return (
      <div className="animate-fade-up mx-auto max-w-lg text-center">
        <p className="text-sm text-muted">Règle introuvable.</p>
        <Link href={LIST_HREF} className="mt-4 inline-block text-sm text-teal hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const serviceLabel =
    COMMISSION_SERVICE_TYPE_LABELS[rule.service_type] ?? rule.service_type;

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <PageHeader
        title="Modifier la règle"
        breadcrumb={["Admin", "Finance", "Règles de commission", rule.rule_name]}
      />

      <p className="mb-6 text-sm">
        <Link href={LIST_HREF} className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
      </p>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        {serviceLabel} · {rule.category_code} — ajustez le nom et la répartition
        des taux. Le périmètre et le service ne sont pas modifiables après création.
      </p>

      <CommissionRuleForm
        mode="edit"
        rule={rule}
        allRules={rules}
        backHref={LIST_HREF}
        onSuccess={() => router.push(LIST_HREF)}
      />
    </div>
  );
}
