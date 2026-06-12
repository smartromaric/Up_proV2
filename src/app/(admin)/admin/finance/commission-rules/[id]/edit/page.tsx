import { CommissionRuleEditPage } from "@/features/finance/pages/CommissionRuleEditPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommissionRuleEditPage ruleId={id} />;
}
