"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { CommissionRuleForm } from "../components/CommissionRuleForm";
import { useCommissionRulesList } from "../api/commissionRules.queries";

const LIST_HREF = "/admin/finance/commission-rules";

export function CommissionRuleCreatePage() {
  const router = useRouter();
  const { data: rules = [], isLoading, isError } = useCommissionRulesList();

  if (isLoading) {
    return <SimplePageSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Impossible de charger les règles existantes.
      </p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <PageHeader
        title="Nouvelle règle de commission"
        breadcrumb={["Admin", "Finance", "Règles de commission", "Nouvelle"]}
      />

      <p className="mb-6 text-sm">
        <Link href={LIST_HREF} className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
      </p>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        Définissez le périmètre, les taux et la répartition franchise / partenaire.
        Pour une dérogation partenaire, une règle franchise de référence doit déjà
        exister pour le même service et la même catégorie.
      </p>

      <CommissionRuleForm
        mode="create"
        allRules={rules}
        backHref={LIST_HREF}
        onSuccess={() => router.push(LIST_HREF)}
      />
    </div>
  );
}
