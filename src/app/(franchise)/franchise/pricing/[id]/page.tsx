import { FranchisePricingEditPage } from "@/features/franchise/pages/FranchisePricingEditPage";

export default async function FranchisePricingEditRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchisePricingEditPage pricingId={id} />;
}
